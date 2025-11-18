#!/usr/bin/env python3
"""Check wallet address from private key."""
import hashlib
from eth_account import Account

# Your private key from .env
private_key = "0xa7188e9946941d6cd9261234dc50e945ec020f3e3cccfb994f1a1dc0c2a09ac4"

try:
    account = Account.from_key(private_key)
    print(f"Wallet Address: {account.address}")
    print(f"\nTo get testnet tokens, you may need to:")
    print(f"1. Check OriginTrail Discord/Telegram for testnet faucet")
    print(f"2. Request tokens for address: {account.address}")
    print(f"3. Or use a different wallet that already has testnet tokens")
except Exception as e:
    print(f"Error: {e}")
    print("\nNote: You may need to install eth-account:")
    print("pip install eth-account")

