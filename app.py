import requests
import urllib3
import os

from dotenv import load_dotenv 

# Загружаем переменные из файла .env
load_dotenv()

DATA_URL = os.getenv("DATA_URL")

# Suppress insecure request warnings due to verify=False (like -k in curl)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def fetch_data_with_auth():
    # 1. Authenticate to get the access token
    auth_url = os.getenv("ABANK_URL_AUTH")
    credentials = {
        "username": os.getenv("ABANK_USERNAME"),
        "password": os.getenv("ABANK_PASSWORD")
    }

    try:
        print("Authenticating...")
        # verify=False is the equivalent of -k in curl
        auth_response = requests.post(auth_url, json=credentials, verify=False)
        auth_response.raise_for_status() 
        
        # Assuming the token is returned in a JSON body under the key 'access_token'
        auth_data = auth_response.json()
        access_token = auth_data.get("data", {}).get("access_token")
        
        # If the API returns it under a different key like "token", update the line above.
        if not access_token:
            print("Authentication succeeded, but no 'access_token' found in the response.")
            print("Response:", auth_data)
            return

        print("Authentication successful! Token obtained.")

        # 2. Make the second request using the access token
        data_url = DATA_URL
        # Usually, the token is passed in the Authorization header
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        print(f"Fetching data from api...")
        # Change requests.get to requests.post if the second request needs to be a POST
        data_response = requests.get(data_url, headers=headers, verify=False)
        data_response.raise_for_status()

        print("Data successfully retrieved:")
        print(data_response.json())

    except requests.exceptions.RequestException as e:
        print(f"An HTTP error occurred: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Error Details: {e.response.text}")

if __name__ == "__main__":
    fetch_data_with_auth()
