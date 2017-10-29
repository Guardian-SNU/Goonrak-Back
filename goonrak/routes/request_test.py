import requests
import json

url='http://172.16.76.77:9999'
#cookie={'Cookie':'s:iO1VfDbgvFCGwDOrWmo3b2uxWwbzZJvq.lApmdvixHHbBANrqH7byYxNhliIcAGvKpERVoFbdKM0'}

def login(user,password):
    api='/inout/login'
    userinfo={
        "username":user,
        "password":password
    }
    print url+api
    res=requests.post(url+api,data=userinfo)
    print res.cookies
    #print res.session
    print res.text
    #print '1234'

login('aaa','bbb')
#req2('aaa','bbb')

