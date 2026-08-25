import re
import sys
import os

def parse_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all pgTable calls
    # Pattern: pgTable\(\s*"([^"]+)"\s*,\s*\{([^}]+)\}(?:\s*,\s*\([^)]*\))?;
    # We'll do a simpler approach: split by pgTable and then extract
    # But note: there might be nested braces.
    # We'll use a simple regex that matches until the closing brace of the table definition.
    # This is not perfect but works for our case.
    
    tables = []
    # Remove comments to avoid false positives
    content_no_comments = re.sub(r'//.*', '', content)
    content_no_comments = re.sub(r'/\[*[\s\S]*?\]*/', '', content_no_comments)
    
    # Find pgTable patterns
    pattern = r'pgTable\(\s*"([^"]+)"\s*,\s*\{([^}]+)\}'
    matches = re.finditer(pattern, content_no_comments, re.DOTALL)
    
    for match in matches:
        table_name = match.group(1)
        table_def = match.group(2)
        
        # Extract columns from table_def
        columns = []
        # Split by lines and look for patterns like: columnName: type(...)
        lines = table_def.split('\n')
        for line in lines:
            line = line.strip()
            if not line or line.startswith('//'):
                continue
            # Match column definition: id: serial("id").primaryKey(),
            # or name: varchar("name", { length: 100 }).notNull(),
            col_match = re.match(r'(\w+)\s*:\s*(\w+)(?:\([^)]*\))?(?:\.[^)]*\([^)]*\))?', line)
            if col_match:
                col_name = col_match.group(1)
                col_type = col_match.group(2)
                # Extract more details if needed
                columns.append((col_name, col_type))
            else:
                # Try to match more complex patterns
                pass
        
        tables.append((table_name, columns))
    
    return tables

def main():
    schema_dir = '.'
    files = [f for f in os.listdir(schema_dir) if f.endswith('.ts') and not f.endswith('.backup') and not f.endswith('.bak')]
    
    all_tables = {}
    for file in files:
        filepath = os.path.join(schema_dir, file)
        tables = parse_file(filepath)
        all_tables[file] = tables
    
    # Print in a structured way
    for file, tables in all_tables.items():
        print(f"=== {file} ===")
        for table_name, columns in tables:
            print(f"Table: {table_name}")
            for col_name, col_type in columns:
                print(f"  {col_name}: {col_type}")
            print()

if __name__ == '__main__':
    main()
