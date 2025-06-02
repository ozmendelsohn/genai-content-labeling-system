import requests
import time
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)

URLS = [
    "https://genai-content-labeling-system-frontend.onrender.com",
    "https://genai-content-labeling-system-backend.onrender.com"
]
SLEEP_INTERVAL = 30  # seconds

def send_post_request(url: str) -> None:
    """
    Sends a POST request to the specified URL.

    Parameters
    ----------
    url : str
        The URL to which the POST request will be sent.

    Returns
    -------
    None
    """
    try:
        response = requests.post(url, timeout=10)  # Added timeout
        logging.info(f"POST request to {url} successful with status code: {response.status_code}")
    except requests.exceptions.RequestException as e:
        logging.error(f"POST request to {url} failed: {e}")

def main() -> None:
    """
    Main function to continuously send POST requests to the defined URLs.

    This function runs an infinite loop, sending POST requests to each URL
    in the `URLS` list and then sleeping for `SLEEP_INTERVAL` seconds.

    Parameters
    ----------
    None

    Returns
    -------
    None
    """
    logging.info("Starting auto-post script...")
    while True:
        for url in URLS:
            send_post_request(url)
        logging.info(f"Sleeping for {SLEEP_INTERVAL} seconds...")
        time.sleep(SLEEP_INTERVAL)

if __name__ == "__main__":
    main()


