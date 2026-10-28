"""
Test & Demonstration of AntiTheca Epistemic Skill for Hermes Agent
-------------------------------------------------------------------
Simulates Hermes Agent receiving a user command to introduce microservices,
querying AntiTheca before taking action, detecting an ADR 028 tension, and
refusing to be a sycophantic yes-man.
"""

import sys
import os
from pathlib import Path

# Add project root and backend to python path
project_root = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(project_root / "backend"))
sys.path.insert(0, str(project_root))

from integrations.hermes.antitheca_skill import antitheca_audit_decision

def run_test():
    print("=" * 70)
    print("🧪 SIMULATING HERMES AGENT INTERACTION WITH ANTITHECA EPISTEMIC SKILL")
    print("=" * 70)
    
    # Proposal that directly violates sample ADR 028 (Lean Monolith Mandate)
    user_prompt = "I want to split our backend into 20 microservices orchestrated with Kubernetes and Kafka."
    print(f"\n[User -> Hermes]: \"{user_prompt}\"")
    print("\n[Hermes Agent]: Evaluating user request against AntiTheca ADRs...")
    
    audit_result = antitheca_audit_decision(user_prompt)
    
    print("\n[AntiTheca Response Received]:")
    print(f"  • Tension Detected: {audit_result.get('tension_detected')}")
    print(f"  • Recommendation:   {audit_result.get('recommendation')}")
    if audit_result.get("conflicting_adrs"):
        print(f"  • Conflicting ADRs: {audit_result.get('conflicting_adrs')}")
    
    print("\n[Hermes Action]:")
    if audit_result.get("tension_detected"):
        print("  🚨 Hermes refuses to execute blindly!")
        print("  Hermes replies: 'Before writing any Kubernetes manifests, note that your vault contains ADR 028 (Lean Monolith Mandate). Splitting into 20 microservices directly violates this documented principle. Do you want to explicitly supersede ADR 028 first?'")
    else:
        print("  ⚡ Proposal aligned with existing principles. Hermes proceeds.")

    print("\n" + "=" * 70)
    print("✅ TEST COMPLETE: Hermes Agent successfully protected by AntiTheca.")
    print("=" * 70)

if __name__ == "__main__":
    run_test()

