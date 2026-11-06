import marshal, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def walk(c, ind=0):
    consts = []
    for x in c.co_consts:
        consts.append('<code %s>' % x.co_name if hasattr(x, 'co_name') else repr(x)[:100])
    print(' ' * ind + c.co_name, '| names:', c.co_names, '| consts:', consts)
    for x in c.co_consts:
        if hasattr(x, 'co_name'):
            walk(x, ind + 2)

for p in sys.argv[1:]:
    data = open(p, 'rb').read()[16:]
    print('=====', p)
    walk(marshal.loads(data))
