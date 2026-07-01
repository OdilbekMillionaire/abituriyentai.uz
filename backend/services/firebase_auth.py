"""
Firebase ID token verification using Google's public JWKS.
No service account key required — verifies tokens via public RSA keys.
"""
import httpx
from jose import jwt, JWTError
from cryptography import x509
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat

FIREBASE_CERTS_URL = (
    "https://www.googleapis.com/robot/v1/metadata/x509/"
    "securetoken@system.gserviceaccount.com"
)


async def verify_firebase_token(id_token: str, project_id: str) -> dict:
    """
    Verify a Firebase ID token and return the decoded claims.
    Raises ValueError if the token is invalid.
    """
    # 1. Fetch Firebase's current public X.509 certificates
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(FIREBASE_CERTS_URL)
        r.raise_for_status()
        certs: dict[str, str] = r.json()

    # 2. Get the key ID from the token header
    try:
        header = jwt.get_unverified_header(id_token)
    except JWTError as exc:
        raise ValueError(f"Malformed token header: {exc}") from exc

    kid = header.get("kid")
    if not kid or kid not in certs:
        raise ValueError("Token references unknown key ID")

    # 3. Parse the X.509 certificate → extract RSA public key as PEM
    cert_pem = certs[kid].encode("utf-8")
    cert = x509.load_pem_x509_certificate(cert_pem, default_backend())
    pub_key_pem = (
        cert.public_key()
        .public_bytes(Encoding.PEM, PublicFormat.SubjectPublicKeyInfo)
        .decode("utf-8")
    )

    # 4. Verify and decode the JWT
    try:
        claims = jwt.decode(
            id_token,
            pub_key_pem,
            algorithms=["RS256"],
            audience=project_id,
            issuer=f"https://securetoken.google.com/{project_id}",
        )
    except JWTError as exc:
        raise ValueError(f"Token verification failed: {exc}") from exc

    if not claims.get("sub"):
        raise ValueError("Token missing 'sub' claim")

    return claims
