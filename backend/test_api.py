#!/usr/bin/env python3
"""
Test script for the Technology Debt Assessment API
"""

import asyncio
import aiohttp
import json

async def test_api():
    """Test the API endpoints"""
    base_url = "http://localhost:8000"
    
    async with aiohttp.ClientSession() as session:
        # Test health check
        print("Testing health check...")
        async with session.get(f"{base_url}/") as response:
            if response.status == 200:
                print("✓ Health check passed")
                result = await response.json()
                print(f"  Response: {result}")
            else:
                print("✗ Health check failed")
                return
        
        # Test getting assessments (should be empty initially)
        print("\nTesting get assessments...")
        async with session.get(f"{base_url}/api/assessments") as response:
            if response.status == 200:
                print("✓ Get assessments passed")
                assessments = await response.json()
                print(f"  Found {len(assessments)} assessments")
            else:
                print("✗ Get assessments failed")
        
        # Test running an assessment (this will fail without a valid project path)
        print("\nTesting run assessment...")
        test_data = {"project_path": "/tmp/nonexistent"}
        async with session.post(
            f"{base_url}/api/assessments/run",
            json=test_data,
            headers={"Content-Type": "application/json"}
        ) as response:
            if response.status == 500:  # Expected to fail
                print("✓ Run assessment endpoint is working (expected failure for invalid path)")
            else:
                print(f"? Run assessment returned unexpected status: {response.status}")
                result = await response.text()
                print(f"  Response: {result}")
        
        # Test codebase analysis (this will also fail without a valid project path)
        print("\nTesting codebase analysis...")
        async with session.post(
            f"{base_url}/api/analysis/codebase",
            json=test_data,
            headers={"Content-Type": "application/json"}
        ) as response:
            if response.status == 404:  # Expected to fail
                print("✓ Codebase analysis endpoint is working (expected failure for invalid path)")
            else:
                print(f"? Codebase analysis returned unexpected status: {response.status}")
                result = await response.text()
                print(f"  Response: {result}")
        
        print("\n✓ All basic API tests completed!")

if __name__ == "__main__":
    print("Technology Debt Assessment API Test")
    print("===================================")
    print("Make sure the API server is running on http://localhost:8000")
    print()
    
    try:
        asyncio.run(test_api())
    except Exception as e:
        print(f"✗ Test failed: {e}")
        print("Make sure the API server is running: python api_server.py")
