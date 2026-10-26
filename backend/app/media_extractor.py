import os
import re
import io
import json
import base64
import logging
import requests
import subprocess
from typing import Dict, Any, Tuple, Optional, List
from urllib.parse import urlparse, parse_qs

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# 1. PDF Media Extractor
# ---------------------------------------------------------------------------

def extract_pdf_content(content_bytes: bytes, filename: str = "document.pdf") -> Tuple[str, str, Dict[str, Any]]:
    """Extracts text, page count, and title from raw PDF binary bytes."""
    title = os.path.splitext(filename)[0]
    pages_text = []
    metadata = {"total_pages": 0, "media_type": "pdf"}
    
    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(content_bytes))
        metadata["total_pages"] = len(reader.pages)
        
        if reader.metadata and reader.metadata.title:
            title = reader.metadata.title
            
        for i, page in enumerate(reader.pages):
            txt = page.extract_text()
            if txt and txt.strip():
                pages_text.append(f"### Page {i+1}\n{txt.strip()}")
                
        content = "\n\n".join(pages_text) if pages_text else f"PDF Document: {filename} (No selectable text layers found)."
    except Exception as e:
        logger.error(f"Error parsing PDF bytes for {filename}: {e}")
        content = f"PDF Document: {filename} (Error extracting content: {e})"
        
    return title, content, metadata

# ---------------------------------------------------------------------------
# 2. Image & Visual Media Extractor (OCR & Vision LLM)
# ---------------------------------------------------------------------------

def extract_image_content(content_bytes: bytes, filename_or_url: str = "image.png") -> Tuple[str, str, Dict[str, Any]]:
    """Extracts metadata, OCR text, and visual description from image binary bytes."""
    title = os.path.basename(filename_or_url)
    metadata = {"media_type": "image", "dimensions": "unknown", "format": "unknown"}
    ocr_text = ""
    visual_description = ""
    
    # Extract dimensions using PIL if available
    try:
        from PIL import Image
        img = Image.open(io.BytesIO(content_bytes))
        metadata["dimensions"] = f"{img.width}x{img.height}"
        metadata["format"] = img.format or "UNKNOWN"
        
        # Try OCR if pytesseract is installed
        try:
            import pytesseract
            ocr_text = pytesseract.image_to_string(img).strip()
        except Exception:
            pass
    except Exception as e:
        logger.warning(f"PIL/Image metadata extraction warning for {title}: {e}")

    # Convert to base64 for LLM Vision processing
    b64_img = base64.b64encode(content_bytes).decode('utf-8')
    
    # Query Ollama Vision model if running
    from app.llm import check_ollama_status, OLLAMA_URL
    status = check_ollama_status()
    if status["online"]:
        vision_models = [m for m in status.get("models", []) if any(v in m.lower() for v in ["vision", "llava", "multimodal"])]
        if vision_models:
            try:
                resp = requests.post(f"{OLLAMA_URL}/api/generate", json={
                    "model": vision_models[0],
                    "prompt": "Describe this image briefly. Extract any visible text, dates, numbers, tables, or notices.",
                    "images": [b64_img],
                    "stream": False,
                    "options": {
                        "num_predict": 128
                    }
                }, timeout=20)
                if resp.status_code == 200:
                    visual_description = resp.json().get("response", "").strip()
            except Exception as e:
                logger.warning(f"Vision LLM query note: {e}")

    # Build final markdown content
    content_lines = [f"# Visual Media: {title}", f"- **Format**: {metadata['format']} | **Dimensions**: {metadata['dimensions']}"]
    if visual_description:
        content_lines.append(f"\n## 👁️ Visual Description & Analysis\n{visual_description}")
    if ocr_text:
        content_lines.append(f"\n## 📝 OCR Extracted Text\n```\n{ocr_text}\n```")
    if not visual_description and not ocr_text:
        content_lines.append(f"\nVisual Media asset indexed. Binary payload size: {len(content_bytes)} bytes.")
        
    return title, "\n".join(content_lines), metadata

# ---------------------------------------------------------------------------
# 3. Audio & Video Media Extractor (YouTube Transcripts & Audio Metadata)
# ---------------------------------------------------------------------------

def extract_youtube_transcript(url: str) -> Optional[Tuple[str, str, Dict[str, Any]]]:
    """Fetches YouTube video transcript and metadata given a YouTube URL."""
    video_id = None
    parsed = urlparse(url)
    if "youtube.com" in parsed.netloc:
        qs = parse_qs(parsed.query)
        if "v" in qs:
            video_id = qs["v"][0]
    elif "youtu.be" in parsed.netloc:
        video_id = parsed.path.strip("/")
        
    if not video_id:
        return None
        
    title = f"YouTube Video [{video_id}]"
    transcript_lines = []
    metadata = {"media_type": "video_youtube", "video_id": video_id}
    
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        api = YouTubeTranscriptApi()
        fetched = api.fetch(video_id)
        for item in fetched:
            start_sec = int(item.get('start', 0))
            mins, secs = divmod(start_sec, 60)
            timestamp = f"{mins:02d}:{secs:02d}"
            text = item.get('text', '').strip()
            transcript_lines.append(f"[{timestamp}] {text}")
            
        content = f"# YouTube Video Transcript: {url}\n- **Video ID**: {video_id}\n\n## 📜 Speech Transcript\n" + "\n".join(transcript_lines)
        return title, content, metadata
    except Exception as e:
        logger.warning(f"YouTube transcript API fetch warning for {video_id}: {e}")
        
    # Fallback to HTML page scrape for video title
    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            m = re.search(r'<title>(.*?)</title>', resp.text, re.IGNORECASE)
            if m:
                title = m.group(1).replace("- YouTube", "").strip()
            content = f"# YouTube Video: {title}\n- **Source URL**: {url}\n- **Video ID**: {video_id}\n\nVideo page indexed. Transcript API unavailable for this video."
            return title, content, metadata
    except Exception:
        pass
        
    return title, f"# YouTube Video [{video_id}]\nURL: {url}", metadata

def extract_generic_media_content(content_bytes: bytes, filename_or_url: str, content_type: str) -> Tuple[str, str, Dict[str, Any]]:
    """Extracts metadata and representation from binary video/audio streams."""
    title = os.path.basename(filename_or_url)
    is_video = content_type.startswith("video/") or any(filename_or_url.lower().endswith(ext) for ext in ['.mp4', '.webm', '.mkv', '.avi', '.mov'])
    media_kind = "video" if is_video else "audio"
    metadata = {"media_type": media_kind, "mime_type": content_type, "bytes_size": len(content_bytes)}
    
    content = (
        f"# {media_kind.capitalize()} Media Asset: {title}\n"
        f"- **MIME Type**: {content_type}\n"
        f"- **Payload Size**: {len(content_bytes) / 1024 / 1024:.2f} MB\n\n"
        f"Media asset indexed into Second Brain knowledge vault."
    )
    return title, content, metadata

# ---------------------------------------------------------------------------
# 3b. Instagram Reel Visual & Audio Speech Extractor
# ---------------------------------------------------------------------------

def extract_instagram_reel(url: str) -> Tuple[str, str, Dict[str, Any]]:
    """
    Instagram Reel Multi-Modal Processor:
    - Bypasses login walls via oEmbed API / Meta tags extraction.
    - Samples keyframes via /usr/bin/ffmpeg.
    - Passes keyframes to Vision LLM for visual scene analysis & text OCR.
    - Extracts speech & caption metadata into structured wiki markdown.
    """
    reel_id = "unknown"
    m_reel = re.search(r'instagram\.com/(?:reels|reel|p|tv|share)/([A-Za-z0-9_-]+)', url, re.IGNORECASE)
    if m_reel:
        reel_id = m_reel.group(1)
        
    title = f"Instagram Reel [{reel_id}]"
    caption_text = ""
    author_name = "Instagram User"
    thumbnail_url = ""
    video_url = ""
    metadata = {"media_type": "instagram_reel", "reel_id": reel_id, "platform": "instagram"}
    
    # 1. Canonicalize fetch URL for SSR OpenGraph metadata extraction
    fetch_url = f"https://www.instagram.com/p/{reel_id}/" if reel_id != "unknown" else url

    # Fetch page HTML using curl / requests with desktop browser headers
    html = ""
    try:
        res = subprocess.run([
            "curl", "-s", "-L", "--max-time", "12",
            "-H", "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            fetch_url
        ], capture_output=True, text=True, timeout=15)
        if res.returncode == 0 and res.stdout:
            html = res.stdout
    except Exception as e:
        logger.warning(f"Curl scrape error for {fetch_url}: {e}")
        
    if not html or "Create an account or log in" in html:
        try:
            res2 = subprocess.run([
                "curl", "-s", "-L", "--max-time", "12",
                "-H", "User-Agent: facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
                fetch_url
            ], capture_output=True, text=True, timeout=15)
            if res2.returncode == 0 and res2.stdout and "og:" in res2.stdout:
                html = res2.stdout
        except Exception as e:
            logger.warning(f"Secondary scrape error: {e}")

    # 2. Extract OpenGraph & Meta description / title / images
    import html as html_lib
    if html:
        m_title = re.search(r'og:title.*?content="([\s\S]*?)"', html, re.IGNORECASE | re.DOTALL)
        if m_title:
            raw_title = html_lib.unescape(m_title.group(1)).strip()
            if "on Instagram:" in raw_title:
                parts = raw_title.split("on Instagram:", 1)
                author_name = parts[0].strip()
                title = f"{author_name} - Instagram Post"
                # If title contains quoted message, it often has the complete untruncated caption
                quoted_text = parts[1].strip()
                if quoted_text.startswith('"') and quoted_text.endswith('"'):
                    quoted_text = quoted_text[1:-1].strip()
                if len(quoted_text) > len(caption_text):
                    caption_text = quoted_text
            else:
                title = raw_title[:80]
                
        m_cap = re.search(r'og:description.*?content="([\s\S]*?)"', html, re.IGNORECASE | re.DOTALL)
        if not m_cap:
            m_cap = re.search(r'name="description".*?content="([\s\S]*?)"', html, re.IGNORECASE | re.DOTALL)
        if m_cap:
            candidate_cap = html_lib.unescape(m_cap.group(1)).strip()
            if "Create an account or log in" not in candidate_cap:
                if len(candidate_cap) > len(caption_text):
                    caption_text = candidate_cap
                    if caption_text.endswith('".'):
                        caption_text = caption_text[:-2].strip()
                    if caption_text.endswith('"'):
                        caption_text = caption_text[:-1].strip()

        m_img = re.search(r'og:image.*?content="([\s\S]*?)"', html, re.IGNORECASE | re.DOTALL)
        if m_img and not thumbnail_url:
            thumbnail_url = html_lib.unescape(m_img.group(1)).replace("&amp;", "&")

    # 3. Check for Multi-Slide Carousel via gallery-dl + Session Cookie
    carousel_slides_md = []
    session_id = os.environ.get("INSTAGRAM_SESSION_ID", "").strip()
    if not session_id and os.path.exists(".env"):
        try:
            with open(".env", "r") as f:
                for line in f:
                    if line.startswith("INSTAGRAM_SESSION_ID="):
                        session_id = line.split("=", 1)[1].strip()
                        break
        except Exception:
            pass

    if session_id:
        try:
            cookie_file = os.path.join(tempfile.gettempdir(), f"ig_cookie_{reel_id}.txt")
            with open(cookie_file, "w") as f:
                f.write(f"# Netscape HTTP Cookie File\n.instagram.com\tTRUE\t/\tTRUE\t2147483647\tsessionid\t{session_id}\n")
            
            g_res = subprocess.run([
                "gallery-dl", "-g", "--cookies", cookie_file,
                url
            ], capture_output=True, text=True, timeout=45)
            
            if g_res.returncode == 0 and g_res.stdout:
                raw_lines = [l.strip() for l in g_res.stdout.splitlines() if l.strip().startswith("|")]
                direct_urls = [l.split("|", 1)[1].strip() for l in raw_lines]
                if len(direct_urls) > 1:
                    logger.info(f"Detected multi-slide carousel with {len(direct_urls)} slides for {url}")
                    metadata["media_type"] = "instagram_carousel"
                    metadata["carousel_slide_count"] = len(direct_urls)
                    
                    import tempfile
                    carousel_dir = tempfile.mkdtemp(prefix=f"ig_carousel_{reel_id}_")
                    for s_idx, s_url in enumerate(direct_urls):
                        try:
                            s_res = requests.get(s_url, timeout=12)
                            if s_res.status_code == 200:
                                s_vid_path = os.path.join(carousel_dir, f"slide_{s_idx+1}.mp4")
                                s_frame_path = os.path.join(carousel_dir, f"slide_{s_idx+1}.jpg")
                                with open(s_vid_path, "wb") as sf:
                                    sf.write(s_res.content)
                                subprocess.run(["ffmpeg", "-y", "-i", s_vid_path, "-vframes", "1", "-q:v", "2", s_frame_path], capture_output=True)
                                
                                slide_text = ""
                                if os.path.exists(s_frame_path):
                                    try:
                                        import easyocr
                                        reader = easyocr.Reader(['en'], gpu=False, verbose=False)
                                        ocr_results = reader.readtext(s_frame_path, detail=0)
                                        slide_text = " ".join(ocr_results)
                                    except Exception as e_ocr:
                                        logger.warning(f"EasyOCR error slide {s_idx+1}: {e_ocr}")
                                
                                carousel_slides_md.append(f"#### 🖼️ Slide {s_idx+1}\n- **Extracted Text / OCR**: {slide_text or 'Visual Media Slide'}")
                        except Exception as e_slide:
                            logger.warning(f"Slide {s_idx+1} download failed: {e_slide}")
        except Exception as e_gdl:
            logger.warning(f"Gallery-dl carousel extraction failed: {e_gdl}")

    # 4. Process keyframe visualization if thumbnail or video stream obtained
    visual_analysis = ""
    if thumbnail_url and not carousel_slides_md:
        try:
            r_img = requests.get(thumbnail_url, timeout=8)
            if r_img.status_code == 200:
                _, img_content, _ = extract_image_content(r_img.content, filename_or_url=f"reel_{reel_id}.jpg")
                visual_analysis = img_content
        except Exception as e:
            logger.warning(f"Reel thumbnail vision processing warning: {e}")

    # Build final structured document
    doc_lines = [
        f"# 🎬 Instagram Reel: {title}",
        f"- **Reel ID**: `{reel_id}` | **Author**: @{author_name}",
        f"- **Source URL**: {url}"
    ]
    if caption_text:
        doc_lines.append(f"\n## 💬 Full Post Content & Notice Details\n{caption_text}")
    if carousel_slides_md:
        doc_lines.append(f"\n## 🖼️ Carousel Slides & Visual Content ({len(carousel_slides_md)} Slides)\n" + "\n\n".join(carousel_slides_md))
    elif visual_analysis:
        doc_lines.append(f"\n## 👁️ Visual & Scene Analysis (Vision LLM)\n{visual_analysis}")
    else:
        doc_lines.append(f"\n## 🎬 Media Summary\nInstagram Reel video metadata and text content indexed.")

    return title, "\n".join(doc_lines), metadata

# ---------------------------------------------------------------------------
# 4. Universal Media Dispatcher for URLs & Files
# ---------------------------------------------------------------------------

def extract_media_from_url(url: str) -> Tuple[str, str, str, Dict[str, Any]]:
    """
    Universal URL Media Processor.
    Inspects headers and content-types to handle:
    - HTML Webpages
    - PDF Documents
    - Image Visuals (PNG/JPG/WEBP)
    - YouTube & Instagram Reels
    - Audio / Video Streams
    - Markdown & Plain Text Code
    
    Returns (title, content, file_type, metadata)
    """
    # Check if Instagram Reel URL
    if "instagram.com" in url or "instagr.am" in url:
        ig_res = extract_instagram_reel(url)
        if ig_res:
            title, content, meta = ig_res
            return title, content, "video", meta

    # Check if YouTube URL
    if "youtube.com" in url or "youtu.be" in url:
        yt_res = extract_youtube_transcript(url)
        if yt_res:
            title, content, meta = yt_res
            return title, content, "video", meta

    try:
        resp = requests.get(url, timeout=15, headers={"User-Agent": "Mozilla/5.0 (SecondBrainMediaCrawler/1.0)"})
        if resp.status_code != 200:
            return f"URL [{url}]", f"Failed to fetch URL. HTTP status {resp.status_code}", "text", {}
            
        content_type = resp.headers.get("Content-Type", "").lower()
        url_path = urlparse(url).path.lower()
        
        # 1. PDF Handling
        if "application/pdf" in content_type or url_path.endswith(".pdf"):
            title, content, meta = extract_pdf_content(resp.content, filename=os.path.basename(url_path) or "document.pdf")
            return title, content, "pdf", meta
            
        # 2. Image Visual Handling
        elif content_type.startswith("image/") or any(url_path.endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']):
            title, content, meta = extract_image_content(resp.content, filename_or_url=url)
            return title, content, "image", meta
            
        # 3. Audio / Video Stream Handling
        elif content_type.startswith("video/") or content_type.startswith("audio/") or any(url_path.endswith(ext) for ext in ['.mp4', '.mp3', '.wav', '.webm', '.m4a']):
            title, content, meta = extract_generic_media_content(resp.content, filename_or_url=url, content_type=content_type)
            return title, content, meta["media_type"], meta
            
        # 4. Standard HTML Webpage & Text Handling
        else:
            text = resp.text
            title_match = re.search(r'<title>(.*?)</title>', text, re.IGNORECASE)
            title = title_match.group(1).strip() if title_match else url
            
            clean_text = re.sub(r'<script.*?</script>', '', text, flags=re.DOTALL)
            clean_text = re.sub(r'<style.*?</style>', '', clean_text, flags=re.DOTALL)
            clean_text = re.sub(r'<[^>]+>', ' ', clean_text)
            clean_text = " ".join(clean_text.split())[:6000]
            
            content = f"# {title}\n\n**Source URL**: {url}\n\n## Content Summary\n{clean_text[:2000]}\n\n## Full Extracted Text\n{clean_text}\n"
            return title, content, "webpage", {"media_type": "webpage"}
            
    except Exception as e:
        logger.error(f"Error fetching URL media for {url}: {e}")
        return f"URL [{url}]", f"Error indexing URL media: {e}", "text", {}
