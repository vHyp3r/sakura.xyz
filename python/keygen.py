"""Generate keys in the format ``AAAAA-A8A6A-99999``."""

import secrets
import string


_ALPHANUMERIC = string.ascii_uppercase + string.digits
_last_key: str | None = None


def generate_key() -> str:
	"""Return a cryptographically random key with three five-character parts."""
	global _last_key

	key = "-".join(
		"".join(secrets.choice(_ALPHANUMERIC) for _ in range(5))
		for _ in range(3)
	)

	# Ensure consecutive calls never return the same key.
	while key == _last_key:
		key = "-".join(
			"".join(secrets.choice(_ALPHANUMERIC) for _ in range(5))
			for _ in range(3)
		)

	_last_key = key
	return key


if __name__ == "__main__":
	print(generate_key())
