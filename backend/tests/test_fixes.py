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

if __name__ == "__main__":
    unittest.main()
