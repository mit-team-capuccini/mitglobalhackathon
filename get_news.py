import requests
from datetime import datetime, timedelta
import urllib3
import time
from pymongo import MongoClient
from openai import OpenAI
import os

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def get_news(query, start_date=None, end_date=None, max_articles=100):
    # If no dates are provided, use the last 7 days
    if not start_date:
        start_date = (datetime.now() - timedelta(days=7)).strftime('%Y%m%d')
    else:
        start_date = datetime.strptime(start_date, '%Y-%m-%d').strftime('%Y%m%d')
    
    if not end_date:
        end_date = datetime.now().strftime('%Y%m%d')
    else:
        end_date = datetime.strptime(end_date, '%Y-%m-%d').strftime('%Y%m%d')
    
    # GDELT API endpoint
    url = "https://api.gdeltproject.org/api/v2/doc/doc"
    
    # Build the query parameters
    params = {
        'query': query,
        'startdatetime': f"{start_date}000000",
        'enddatetime': f"{end_date}235959",
        'format': 'json',
        'mode': 'artlist',
        'maxrecords': max_articles  # Limit the number of results
    }
    
    # Browser-like headers
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1'
    }
    
    try:
        # Add a delay before making the request
        time.sleep(2)  # Wait 2 seconds before making the request
        
        # Make the API request with SSL verification disabled and browser-like headers
        response = requests.get(url, params=params, verify=False, headers=headers)
        
        # Check if we hit the rate limit
        if response.status_code == 429:
            print("Rate limit reached. Waiting before retrying...")
            time.sleep(10)  # Wait 10 seconds before retrying
            response = requests.get(url, params=params, verify=False, headers=headers)
        
        response.raise_for_status()  # Raise an exception for bad status codes
        
        # Parse the response
        data = response.json()
        
        # Extract and return the articles
        articles = []
        for article in data.get('articles', []):
            articles.append({
                'url': article.get('url'),
                'title': article.get('title'),
                'date': article.get('date'),
                'source': article.get('source')
            })
        
        return articles
    
    except requests.exceptions.RequestException as e:
        print(f"Error fetching news: {str(e)}")
        return []

def analyze_article_with_chatgpt(article, client):
    prompt = f"""
    Analyze this news article title and determine if it's related to the Valencia flooding.
    If it is relevant, translate the title to English. If not, respond with 'NOT_RELEVANT'.
    
    Title: {article['title']}
    URL: {article['url']}
    Date: {article['date']}
    Source: {article['source']}
    
    Respond in this exact format:
    RELEVANCE: [YES/NO]
    TRANSLATION: [English translation if relevant, or 'NOT_RELEVANT']
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that analyzes news articles about natural disasters and relief efforts."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        
        result = response.choices[0].message.content.strip()
        relevance = result.split('\n')[0].split(': ')[1]
        translation = result.split('\n')[1].split(': ')[1]
        
        if relevance.strip().lower() == 'yes':
            article['translated_title'] = translation
            return article
        return None
    
    except Exception as e:
        print(f"Error analyzing article with ChatGPT: {str(e)}")
        return None

def save_to_mongodb(articles, query, start_date, end_date):
    # MongoDB connection string
    mongo_uri = os.getenv('MONGODB_URI')
    
    try:
        # Connect to MongoDB
        client = MongoClient(mongo_uri)
        db = client['critical_infrastructure']
        collection = db['news_articles']
        
        # Prepare the document to insert
        document = {
            'query': query,
            'start_date': start_date,
            'end_date': end_date,
            'timestamp': datetime.now(),
            'articles': articles
        }
        
        # Insert the document
        result = collection.insert_one(document)
        print(f"Successfully saved {len(articles)} articles to MongoDB with ID: {result.inserted_id}")
        
        # Close the connection
        client.close()
        return True
    except Exception as e:
        print(f"Error saving to MongoDB: {str(e)}")
        return False

# Example usage
if __name__ == "__main__":
    # Initialize OpenAI client
    openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    
    # Search for documents mentioning "valencia flooding" in 2024
    results = get_news(
        "valencia flood",
        start_date="2024-10-15",
        end_date="2024-11-15",
        max_articles=50
    )
    
    if results:
        # Analyze articles with ChatGPT
        relevant_articles = []
        for article in results:
            analyzed_article = analyze_article_with_chatgpt(article, openai_client)
            if analyzed_article:
                relevant_articles.append(analyzed_article)
        
        # Save relevant articles to MongoDB
        if relevant_articles:
            save_to_mongodb(
                relevant_articles,
                "valencia flood",
                "2024-10-15",
                "2024-11-15"
            )
            
            # Print the results
            print(f"\nFound {len(relevant_articles)} relevant articles:")
            for article in relevant_articles:
                print(f"\nOriginal Title: {article['title']}")
                print(f"Translated Title: {article['translated_title']}")
                print(f"URL: {article['url']}")
                print(f"Date: {article['date']}")
                print(f"Source: {article['source']}")
                print("-" * 50)
        else:
            print("No relevant articles found.")
    else:
        print("No articles found.")
