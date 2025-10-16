import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
import json
import os
from pathlib import Path

def json_to_parquet_partitioned(json_file_path, output_dir, chunk_size=10000, max_file_size_mb=100):
    """
    Convert large JSON to multiple Parquet files to manage memory efficiently.
    
    Args:
        json_file_path (str): Path to input JSON file
        output_dir (str): Directory to save partitioned Parquet files
        chunk_size (int): Number of records per chunk
        max_file_size_mb (int): Maximum size per Parquet file in MB
    """
    os.makedirs(output_dir, exist_ok=True)
    
    file_counter = 0
    current_data = []
    
    with open(json_file_path, 'r', encoding='utf-8') as file:
        chunk = []
        
        for line_num, line in enumerate(file, 1):
            try:
                json_obj = json.loads(line.strip())
                chunk.append(json_obj)
                
                if len(chunk) >= chunk_size:
                    df = pd.DataFrame(chunk)
                    current_data.append(df)
                    
                    # Check if we should write to file
                    combined_df = pd.concat(current_data, ignore_index=True)
                    estimated_size = combined_df.memory_usage(deep=True).sum() / (1024 * 1024)  # MB
                    
                    if estimated_size >= max_file_size_mb:
                        output_file = Path(output_dir) / f"part_{file_counter:04d}.parquet"
                        combined_df.to_parquet(output_file, index=False)
                        print(f"Saved {output_file} with {len(combined_df)} records")
                        
                        file_counter += 1
                        current_data = []
                    
                    chunk = []
                    print(f"Processed {line_num} lines...")
                    
            except json.JSONDecodeError as e:
                print(f"Error parsing line {line_num}: {e}")
                continue
        
        # Process remaining data
        if chunk:
            df = pd.DataFrame(chunk)
            current_data.append(df)
        
        if current_data:
            combined_df = pd.concat(current_data, ignore_index=True)
            output_file = Path(output_dir) / f"part_{file_counter:04d}.parquet"
            combined_df.to_parquet(output_file, index=False)
            print(f"Saved final {output_file} with {len(combined_df)} records")
    
    print(f"Conversion completed! Partitioned files saved in {output_dir}")

# Usage
json_to_parquet_partitioned('large_file.json', 'parquet_output/', chunk_size=5000, max_file_size_mb=50)
