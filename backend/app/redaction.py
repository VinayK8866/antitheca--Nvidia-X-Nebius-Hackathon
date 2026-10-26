import os
import re
import math
import fnmatch
import logging
from typing import List, Tuple, Dict, Any, Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Shannon Entropy Calculation for High-Entropy Secret Detection
# ---------------------------------------------------------------------------

def calculate_entropy(text: str) -> float:
    """Calculates Shannon entropy of a string."""
    if not text:
        return 0.0
    entropy = 0.0
    length = len(text)
    prob_map = {}
    for char in text:
        prob_map[char] = prob_map.get(char, 0) + 1
    for count in prob_map.values():
        p = count / length
        entropy -= p * math.log2(p)
    return entropy

# ---------------------------------------------------------------------------
# Pre-compiled Regex Patterns for High-Risk Tokens & PII
# ---------------------------------------------------------------------------

SECRET_PATTERNS = [
    # API Keys & Cloud Credentials
    (re.compile(r'\b(sk-[a-zA-Z0-9]{20,})\b'), '[REDACTED_OPENAI_KEY]'),
    (re.compile(r'\b(ant-[a-zA-Z0-9_-]{20,})\b'), '[REDACTED_ANTHROPIC_KEY]'),
    (re.compile(r'\b(AIza[0-9A-Za-z-_]{35})\b'), '[REDACTED_GOOGLE_API_KEY]'),
    (re.compile(r'\b(hf_[a-zA-Z0-9]{30,})\b'), '[REDACTED_HUGGINGFACE_TOKEN]'),
    (re.compile(r'\b(ghp_[a-zA-Z0-9]{36}|gho_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{40,})\b'), '[REDACTED_GITHUB_TOKEN]'),
    (re.compile(r'\b(AKIA[0-9A-Z]{16})\b'), '[REDACTED_AWS_ACCESS_KEY]'),
    (re.compile(r'\b(xox[baprs]-[0-9a-zA-Z]{10,48})\b'), '[REDACTED_SLACK_TOKEN]'),
    
    # Private Keys & Certificates
    (re.compile(r'-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----'), '[REDACTED_PRIVATE_KEY_BLOCK]'),
    (re.compile(r'-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----'), '[REDACTED_CERTIFICATE_BLOCK]'),
    
    # JWT Tokens
    (re.compile(r'\beyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b'), '[REDACTED_JWT_TOKEN]'),
    
    # Generic Assignment Secrets (password="...", api_secret='...', token: "...")
    (re.compile(r'(?i)\b(password|passwd|secret|api_key|token|auth_token|client_secret)\s*[:=]\s*["\']([^"\']{6,})["\']'), r'\1="[REDACTED_SECRET]"'),
    
    # Private PII (Phone numbers, SSNs, Credit Cards)
    (re.compile(r'\b(?:\d{3}-\d{2}-\d{4}|\d{9})\b'), '[REDACTED_SSN]'),
    (re.compile(r'\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b'), '[REDACTED_CREDIT_CARD]'),
    (re.compile(r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b'), '[REDACTED_PHONE_NUMBER]')
]

# ---------------------------------------------------------------------------
# Redaction Engine Class
# ---------------------------------------------------------------------------

class RedactionEngine:
    @staticmethod
    def scrub_text(text: str, entropy_threshold: float = 4.6) -> Tuple[str, List[str]]:
        """
        Scans and scrubs secrets, API keys, private tokens, and PII from text.
        Returns: (sanitized_text, list_of_redaction_events)
        """
        if not text:
            return text, []

        redactions_applied = []
        sanitized = text

        # 1. Regex-based pattern matching
        for pattern, replacement in SECRET_PATTERNS:
            matches = pattern.findall(sanitized)
            if matches:
                count = len(matches)
                sanitized = pattern.sub(replacement, sanitized)
                redactions_applied.append(f"Pattern '{pattern.pattern[:30]}...' matched ({count}x)")

        # 2. Entropy-based token scanner for naked un-prefixed secrets
        words = re.findall(r'\b[A-Za-z0-9+/=_-]{24,}\b', sanitized)
        for w in words:
            if not w.startswith('[REDACTED_') and not w.endswith(']'):
                ent = calculate_entropy(w)
                if ent >= entropy_threshold:
                    sanitized = sanitized.replace(w, '[REDACTED_HIGH_ENTROPY_TOKEN]')
                    redactions_applied.append(f"High-entropy token masked (len: {len(w)}, entropy: {ent:.2f})")

        return sanitized, redactions_applied

# ---------------------------------------------------------------------------
# .brainignore Handler
# ---------------------------------------------------------------------------

def load_brainignore_rules(root_dir: str) -> List[str]:
    """Loads ignore glob rules from .brainignore if present."""
    ignore_file = os.path.join(root_dir, ".brainignore")
    rules = [
        "*.env", "*.env.*", "*.pem", "*.key", "*.id_rsa", "*.p12",
        "*.db-wal", "*.db-shm", ".git/*", "venv/*", "node_modules/*",
        "*.backup*", "*.tmp"
    ]
    if os.path.exists(ignore_file):
        try:
            with open(ignore_file, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#"):
                        rules.append(line)
        except Exception as e:
            logger.warning(f"Failed to read .brainignore: {e}")
    return rules

def is_path_ignored(file_path: str, root_dir: str, rules: Optional[List[str]] = None) -> bool:
    """Checks if a relative path matches .brainignore patterns."""
    if rules is None:
        rules = load_brainignore_rules(root_dir)

    rel_path = os.path.relpath(file_path, root_dir)
    filename = os.path.basename(file_path)

    for rule in rules:
        if fnmatch.fnmatch(rel_path, rule) or fnmatch.fnmatch(filename, rule):
            return True
        if rule.endswith('/') and rel_path.startswith(rule.rstrip('/')):
            return True
    return False

def redact_content(text: str) -> Tuple[str, int]:
    """Convenience wrapper returning (sanitized_text, count_of_redactions)."""
    sanitized, redactions = RedactionEngine.scrub_text(text)
    return sanitized, len(redactions)

