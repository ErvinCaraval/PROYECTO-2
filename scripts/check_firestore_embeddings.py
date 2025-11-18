#!/usr/bin/env python3
import os
import sys
import json

ROOT = os.path.dirname(os.path.dirname(__file__))
SERVICE_ACCOUNT = os.path.join(ROOT, 'backend-v1', 'serviceAccountKey.json')

if not os.path.exists(SERVICE_ACCOUNT):
    print('No se encontró el archivo de credenciales:', SERVICE_ACCOUNT)
    sys.exit(2)

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
except Exception:
    print('firebase-admin no está instalado. Salga con código 3')
    sys.exit(3)

def main():
    cred = credentials.Certificate(SERVICE_ACCOUNT)
    try:
        app = firebase_admin.initialize_app(cred)
    except ValueError:
        # already initialized
        pass

    db = firestore.client()
    col_name = 'facial_embeddings'
    try:
        docs = list(db.collection(col_name).limit(50).stream())
        total = 0
        # Try to count documents - careful with large collections
        # Use a paginated iterator for safety
        iterator = db.collection(col_name).stream()
        ids = []
        count = 0
        for d in iterator:
            count += 1
            if len(ids) < 20:
                ids.append(d.id)
        print(json.dumps({'exists': True, 'collection': col_name, 'count_preview': count, 'sample_ids': ids}))
    except Exception as e:
        print(json.dumps({'exists': False, 'error': str(e)}))

if __name__ == '__main__':
    main()
