
import pymongo
import dns.resolver
import sys

uri = "mongodb+srv://sawashishkumar327:QfVK0ogY0EOQ5Ptf@cluster0.0eme8jm.mongodb.net/school?retryWrites=true&w=majority"

print(f"Testing connection to: {uri.split('@')[1]}")

try:
    print("Attempting DNS resolution for SRV record...")
    resolver = dns.resolver.Resolver()
    # Attempt to resolve the SRV record manually to see if it works
    srv_records = resolver.resolve('_mongodb._tcp.cluster0.0eme8jm.mongodb.net', 'SRV')
    for srv in srv_records:
        print(f"Found SRV: {srv.target}:{srv.port}")
except Exception as e:
    print(f"DNS Resolution failed: {e}")

try:
    print("\nAttempting PyMongo connection...")
    client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=5000)
    is_master = client.admin.command('isMaster')
    print(f"Connection Successful! Replica Set Name: {is_master.get('setName')}")
except Exception as e:
    print(f"Connection failed: {e}")
