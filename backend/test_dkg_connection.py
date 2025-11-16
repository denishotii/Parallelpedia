#!/usr/bin/env python3
"""Test script to find the correct DKG_OTNODE_URL."""
import httpx
import asyncio
from typing import Optional

# Known valid OT-node URLs
TEST_URLS = [
    # Testnet options
    "https://v6-pegasus-node-02.origin-trail.network:8900",
    "https://v6-pegasus-node-02.origin-trail.network",
    "https://v6-pegasus-node-01.origin-trail.network:8900",
    
    # Mainnet options
    "https://positron.origin-trail.network",
    "https://positron.origin-trail.network:8900",
    
    # Local (if you have a local OT-node)
    "http://localhost:8900",
]

async def test_url(url: str) -> tuple[bool, Optional[str]]:
    """Test if an OT-node URL is accessible."""
    try:
        # Try a simple health check endpoint
        # OT-nodes typically have /node/info or similar endpoints
        endpoints_to_try = [
            "/node/info",
            "/v1/node/info",
            "/api/v1/node/info",
            "/",
        ]
        
        async with httpx.AsyncClient(timeout=5.0) as client:
            for endpoint in endpoints_to_try:
                try:
                    full_url = f"{url.rstrip('/')}{endpoint}"
                    print(f"  Trying: {full_url}")
                    response = await client.get(full_url)
                    if response.status_code in [200, 404]:  # 404 means server is there
                        return True, f"Status {response.status_code}"
                except httpx.TimeoutException:
                    continue
                except httpx.ConnectError:
                    continue
                except Exception as e:
                    continue
        
        return False, "No accessible endpoints found"
    except Exception as e:
        return False, str(e)

async def main():
    print("🔍 Testing DKG OT-node URLs...\n")
    
    working_urls = []
    
    for url in TEST_URLS:
        print(f"Testing: {url}")
        is_working, message = await test_url(url)
        
        if is_working:
            print(f"  ✅ WORKING: {message}\n")
            working_urls.append(url)
        else:
            print(f"  ❌ FAILED: {message}\n")
    
    print("\n" + "="*60)
    if working_urls:
        print("✅ Working URLs found:")
        for url in working_urls:
            print(f"   {url}")
        print("\n💡 Recommended configuration:")
        if "testnet" in working_urls[0] or "pegasus" in working_urls[0]:
            print("   DKG_BLOCKCHAIN=otp:20430")
            print(f"   DKG_OTNODE_URL={working_urls[0]}")
        else:
            print("   DKG_BLOCKCHAIN=otp:2043")
            print(f"   DKG_OTNODE_URL={working_urls[0]}")
    else:
        print("❌ No working URLs found.")
        print("\n💡 Possible issues:")
        print("   1. Network connectivity problems")
        print("   2. Firewall blocking connections")
        print("   3. OT-node URLs may have changed")
        print("\n   Try checking OriginTrail documentation for current URLs:")
        print("   https://docs.origintrail.io/")

if __name__ == "__main__":
    asyncio.run(main())

