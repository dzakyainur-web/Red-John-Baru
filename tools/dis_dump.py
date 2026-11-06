import dis
import marshal
import sys

def decompile_info(path):
    with open(path, 'rb') as f:
        data = f.read()[16:]
    code = marshal.loads(data)
    print(f"=== {path} ===")
    dis.dis(code)

if __name__ == '__main__':
    for p in sys.argv[1:]:
        decompile_info(p)
