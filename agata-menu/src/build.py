import json,sys
sys.path.insert(0,'.')
from data_food import FOOD
from data_bar import BAR, INFO, EXTRA_NAMES
for s in FOOD:
    if s['id']=='extra':
        for it in s['items']:
            if it['id'] in EXTRA_NAMES: it['name']=EXTRA_NAMES[it['id']]
data={"rev":1,"settings":{"photos":True,"prices":True,"desc":True,"tags":True},"sections":FOOD+BAR,"info":INFO}
imgs=json.load(open('images.json'))
used={i.get('img') for s in data['sections'] for i in s['items'] if i.get('img')}
missing=used-set(imgs); assert not missing, missing
A=json.load(open('assets.json'))
J=lambda o: json.dumps(o,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
app=open('app.js').read().replace('/*ASSETS*/',json.dumps(A,separators=(',',':')))
assert '</script' not in app.lower()
t=open('template.html').read()
t=t.replace('/*DATA*/',J(data)).replace('/*APP*/',app).replace('/*IMAGES*/',J(imgs))
open('agata-menu.html','w').write(t)
print(len(t)//1024,'KB', sum(len(s['items']) for s in data['sections']),'items')
