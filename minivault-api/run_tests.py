#!/usr/bin/env python
import subprocess
import sys
import os

def run_tests():
    print("Running MiniVault API Tests...")
    print("=" * 50)
    
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    try:
        result = subprocess.run([
            sys.executable, "-m", "pytest", 
            "tests/", 
            "-v", 
            "--tb=short"
        ], capture_output=False, text=True)
        
        if result.returncode == 0:
            print("\n All tests passed!")
        else:
            print(f"\n Some tests failed (exit code: {result.returncode})")
            
    except Exception as e:
        print(f" Error running tests: {e}")
        return 1
    
    return result.returncode

if __name__ == "__main__":
    exit_code = run_tests()
    sys.exit(exit_code) 