import bcrypt
password = b"TestPass123!"
salt = bcrypt.gensalt()
hash_value = bcrypt.hashpw(password, salt)
print(hash_value.decode('utf-8'))
