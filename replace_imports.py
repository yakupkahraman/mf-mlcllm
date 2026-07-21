import os

def replace_in_files(directory, old_str, new_str):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.go') or file == 'go.mod':
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                if old_str in content:
                    content = content.replace(old_str, new_str)
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(content)

replace_in_files('/Users/yakup/dev/mf-mlcllm/backend', 'github.com/masterfabric-go/masterfabric', 'mf-mlcllm')
