import os
import sys
import unittest

sys.path.insert(0, os.path.abspath("backend"))

class TestFixes(unittest.TestCase):
    def test_llm_client_predict_fast_and_tavily(self):
        from app.llm_client import llm_client
        self.assertTrue(hasattr(llm_client, "predict_fast"))
        res = llm_client.predict_fast("Ping test", system_prompt="Test")
        self.assertIsInstance(res, str)
        self.assertTrue(len(res) > 0)

        from app.tavily_client import tavily_client
        deep_res = tavily_client.deep_research(
            topic="Database Performance",
            claim="Postgres is faster than SQLite for single-user local apps."
        )
        self.assertIn("synthesis", deep_res)
        self.assertTrue(len(deep_res["synthesis"]) > 0)
        print("✓ Test 1 Passed: predict_fast and deep_research synthesis verified.")

    def test_indexed_vector_search(self):
        from app.router import router
        from app.embeddings import generate_embedding
        q_vec = generate_embedding("Kubernetes microservices architecture")
        results = router._vector_search_chunks(q_vec, top_k=3, threshold=0.2)
        self.assertIsInstance(results, list)
        self.assertTrue(len(results) > 0)
        for r in results:
            self.assertIn("similarity", r)
            self.assertIn("title", r)
            self.assertIn("content", r)
        print(f"✓ Test 2 Passed: Indexed vector search returned {len(results)} chunks.")

    def test_persistent_scheduler_and_lock(self):
        from app.scheduler import scheduler
        from app.database import get_self_db_connection

        status = scheduler.get_status()
        self.assertIn("total_autonomous_runs", status)
        self.assertIn("recent_runs", status)

        # Test concurrency lock
        test_date = "2099-01-01"
        acquired = scheduler._acquire_scheduled_cycle_lock(test_date)
        self.assertTrue(acquired)

        # Second worker attempting same date while locked should fail
        acquired_duplicate = scheduler._acquire_scheduled_cycle_lock(test_date)
        self.assertFalse(acquired_duplicate)

        # Mark completed and release
        scheduler._mark_cycle_completed(test_date)
        # Attempting again for a completed date should fail
        self.assertFalse(scheduler._acquire_scheduled_cycle_lock(test_date))

        # Cleanup test lock
        conn = get_self_db_connection()
        conn.execute("DELETE FROM scheduler_state WHERE key IN ('cycle_running_lock', 'last_completed_sleep_date')")
        conn.commit()
        conn.close()
        print("✓ Test 3 Passed: Persistent scheduler telemetry & distributed locking verified.")

    def test_media_extractor_scope_and_resilience(self):
        import app.media_extractor as me
        self.assertTrue(hasattr(me, "tempfile"))
        self.assertTrue(hasattr(me, "get_proxy_url"))
        self.assertTrue(hasattr(me, "get_proxy_dict"))
        self.assertTrue(hasattr(me, "resolve_cookies"))
        self.assertTrue(hasattr(me, "extract_tiktok_video"))

        # 1. Test Proxy resolution
        orig_proxy = os.environ.get("RESIDENTIAL_PROXY_URL")
        try:
            os.environ["RESIDENTIAL_PROXY_URL"] = "http://testuser:testpass@residential.proxy.net:8888"
            self.assertEqual(me.get_proxy_url(), "http://testuser:testpass@residential.proxy.net:8888")
            p_dict = me.get_proxy_dict()
            self.assertIsNotNone(p_dict)
            self.assertEqual(p_dict["http"], "http://testuser:testpass@residential.proxy.net:8888")
            self.assertEqual(p_dict["https"], "http://testuser:testpass@residential.proxy.net:8888")
        finally:
            if orig_proxy:
                os.environ["RESIDENTIAL_PROXY_URL"] = orig_proxy
            else:
                os.environ.pop("RESIDENTIAL_PROXY_URL", None)

        # 2. Test Cookie Vaulting
        orig_ig_sess = os.environ.get("INSTAGRAM_SESSION_ID")
        try:
            os.environ["INSTAGRAM_SESSION_ID"] = "mock_ig_session_xyz123"
            cookie_path, is_temp, sess_id = me.resolve_cookies("instagram")
            self.assertTrue(is_temp)
            self.assertEqual(sess_id, "mock_ig_session_xyz123")
            self.assertTrue(os.path.exists(cookie_path))
            with open(cookie_path, "r") as cf:
                c_content = cf.read()
                self.assertIn(".instagram.com", c_content)
                self.assertIn("mock_ig_session_xyz123", c_content)
            if os.path.exists(cookie_path):
                os.remove(cookie_path)
        finally:
            if orig_ig_sess:
                os.environ["INSTAGRAM_SESSION_ID"] = orig_ig_sess
            else:
                os.environ.pop("INSTAGRAM_SESSION_ID", None)

        # 3. Test TikTok Video Extraction with verified demo fixture
        tt_title, tt_content, tt_meta = me.extract_tiktok_video("https://www.tiktok.com/@tech_lead/video/demo")
        self.assertIsInstance(tt_title, str)
        self.assertIn("Why You Must Replace Postgres", tt_title)
        self.assertEqual(tt_meta["media_type"], "tiktok_reel")
        self.assertTrue(tt_meta.get("demo_fixture_used", False))
        self.assertIn("Kafka Streams", tt_content)

        # 4. Test Universal Media Dispatcher for TikTok
        disp_title, disp_content, disp_modality, disp_meta = me.extract_media_from_url("https://www.tiktok.com/@tech_lead/video/demo")
        self.assertEqual(disp_modality, "video")
        self.assertEqual(disp_meta["media_type"], "tiktok_reel")

        # 5. Test Instagram Reel with verified demo fixture
        title, content, meta = me.extract_instagram_reel("https://www.instagram.com/reel/C8q8q1mP3eT/")
        self.assertIsInstance(title, str)
        self.assertIsInstance(content, str)
        self.assertIn("media_type", meta)
        print("✓ Test 4 Passed: Media extractor proxy routing, cookie vaulting & TikTok ingestion verified.")

    def test_ast_code_auditor(self):
        import ast
        from app.code_auditor import ADRComplianceASTVisitor, code_auditor

        # 1. Verify AST catches real banned import
        bad_code = "import kafka\nfrom celery import Celery\nsecret = 'sk-1234567890123456789012'\n"
        tree = ast.parse(bad_code)
        visitor = ADRComplianceASTVisitor(rel_path="bad_file.py")
        visitor.visit(tree)
        self.assertEqual(len(visitor.violations), 3)

        # 2. Verify AST does NOT flag comments or docstrings (immune to naive regex false positives)
        comment_code = '"""\nWe do NOT use kafka or celery.\n"""\n# Remember: no redis allowed!\nx = 42\n'
        comment_tree = ast.parse(comment_code)
        clean_visitor = ADRComplianceASTVisitor(rel_path="clean_file.py")
        clean_visitor.visit(comment_tree)
        self.assertEqual(len(clean_visitor.violations), 0)

        # 3. Verify workspace-wide AST audit
        audit_res = code_auditor.audit_workspace()
        self.assertIn("status", audit_res)
        self.assertEqual(audit_res["status"], "compliant")
        self.assertEqual(audit_res["compliance_score"], 100)
        self.assertTrue(audit_res["scanned_files_count"] > 0)
        print(f"✓ Test 5 Passed: Python AST code auditor verified ({audit_res['scanned_files_count']} files scanned, 100% compliant).")

    def test_indexed_memory_and_vectorized_retrieval(self):
        import time
        from app.embeddings import generate_embedding
        from app.tiered_memory import tiered_memory
        from app.activator import activator

        q_vec = generate_embedding("SQLite WAL performance and lean monolith architecture")

        # 1. Test Tiered Memory semantic search
        t0 = time.perf_counter()
        results = tiered_memory.semantic_search_memories(q_vec, top_k=3, threshold=0.2)
        elapsed_ms = (time.perf_counter() - t0) * 1000
        self.assertIsInstance(results, list)
        self.assertLess(elapsed_ms, 50.0) # Sub-50ms retrieval benchmark
        print(f"✓ Test 6 Passed: Pre-indexed memory vector search returned {len(results)} matches in {elapsed_ms:.2f}ms.")

        # 2. Test Activator vectorized arbitrage search without on-the-fly embedding bottlenecks
        t1 = time.perf_counter()
        opportunities = activator.find_arbitrage_opportunities("We are deciding whether to introduce Redis for caching.", top_k=3)
        act_elapsed_ms = (time.perf_counter() - t1) * 1000
        self.assertIsInstance(opportunities, list)
        print(f"✓ Test 7 Passed: Activator vectorized search returned {len(opportunities)} opportunities in {act_elapsed_ms:.2f}ms.")

    def test_sub_3s_multimodal_slide_ingestion_and_conflict_detection(self):
        """
        Tests end-to-end multimodal slide processing:
        1. Sub-3s Nemotron-3.5-Super-VL extraction on a high-res slide.
        2. Automatic ADR 028 violation detection triggered from the extracted visual content.
        """
        import io
        import time
        from PIL import Image, ImageDraw
        from app.ingest import ingest_pipeline
        from app.database import get_self_db_connection

        # 1. Ensure ADR 028 exists in decisions table
        conn = get_self_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT id FROM decisions WHERE title LIKE '%ADR 028%'")
        if not cur.fetchone():
            cur.execute("""
            INSERT INTO decisions (title, decision_text, rationale, context, chosen_option)
            VALUES (?, ?, ?, ?, ?)
            """, (
                "ADR 028: Lean Monolith for Solo Execution",
                "Always maintain a lean, single-service decoupled architecture with SQLite WAL. Strictly prohibit distributed microservices or multi-region Kubernetes orchestrators until proven bottleneck.",
                "Premature distribution creates cognitive overhead that destroys solo velocity.",
                "Initial architectural baseline",
                "SQLite Monolith"
            ))
            conn.commit()
        conn.close()

        # 2. Programmatically generate binary 1080p presentation slide image
        img = Image.new('RGB', (1024, 576), color=(15, 23, 42))
        d = ImageDraw.Draw(img)
        d.rectangle([(20, 20), (1004, 556)], outline=(51, 65, 85), width=2)
        d.text((60, 60), "VIRAL ARCHITECTURE ADVICE 2026", fill=(248, 250, 252))
        d.text((60, 160), "Mandate: Break solo MVP into 20 microservices with Kafka streams and 3-region Kubernetes on Day 1.", fill=(239, 68, 68))
        d.text((60, 260), "Complexity equals enterprise resilience regardless of team size.", fill=(226, 232, 240))

        buf = io.BytesIO()
        img.save(buf, format="PNG")
        image_bytes = buf.getvalue()

        # 3. Ingest image bytes through pipeline
        res = ingest_pipeline.ingest_image_bytes(image_bytes, filename="viral_slide_20_microservices.png")
        self.assertIsNotNone(res)
        self.assertEqual(res.get("modality"), "image")
        self.assertIn("pipeline_latency", res)

        # 4. Assert sub-3-second remote extraction benchmark
        extraction_sec = res["pipeline_latency"]["extraction_sec"]
        self.assertLess(extraction_sec, 3.0, f"Multimodal extraction took {extraction_sec}s, exceeding 3.0s benchmark")

        # 5. Assert automated adversarial challenge detection from visual content
        challenge = res.get("adversarial_challenge")
        self.assertIsNotNone(challenge, "Multimodal slide ingestion failed to trigger adversarial challenge")
        self.assertEqual(challenge.get("severity"), "high")
        
        # Verify persistence in SQLite
        conn = get_self_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, title, severity FROM adversarial_challenges WHERE id = ?", (challenge["id"],))
        c_row = cur.fetchone()
        conn.close()
        self.assertIsNotNone(c_row)
        print(f"✓ Test 8 Passed: Multimodal slide processed in {extraction_sec:.2f}s (sub-3s) & triggered HIGH severity conflict #{challenge['id']} ('{challenge['title']}').")

    def test_decoupled_external_cron_and_reboot_persistence(self):
        """
        Tests autonomous background cron reliability:
        1. Executes sleep consolidation cycle via decoupled external process (scripts/run_sleep_cycle.sh).
        2. Asserts persistent SQLite execution log.
        3. Simulates container reboot and verifies scheduler state loads seamlessly from disk.
        """
        import subprocess
        from app.database import get_self_db_connection
        from app.scheduler import AutonomousReplayScheduler

        # 1. Execute external cron CLI script out-of-process
        res = subprocess.run(["./scripts/run_sleep_cycle.sh"], capture_output=True, text=True, timeout=30)
        self.assertEqual(res.returncode, 0, f"External cron script failed: {res.stderr}")

        # 2. Verify audit trail persisted in SQLite
        conn = get_self_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, trigger_source, status FROM scheduler_runs WHERE trigger_source = 'external_cron_worker' ORDER BY id DESC LIMIT 1")
        row = cur.fetchone()
        conn.close()
        self.assertIsNotNone(row, "External cron run was not logged in scheduler_runs SQLite table")

        # 3. Simulate container reboot by instantiating new scheduler instance from persistent storage
        rebooted_scheduler = AutonomousReplayScheduler(target_hour=3, target_minute=0)
        status = rebooted_scheduler.get_status()
        self.assertGreater(status["total_autonomous_runs"], 0)
        self.assertNotEqual(status["last_run"], "None (Pending first cycle)")
        print(f"✓ Test 9 Passed: Decoupled external cron execution & post-reboot SQLite state recovery verified.")

if __name__ == "__main__":
    unittest.main()
