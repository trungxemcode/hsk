"""Context overrides reviewed for this editorial batch, not a general parser."""
import re
from pypinyin import pinyin, Style

def pin(text):
    tokens=list(re.finditer(r'[\u3400-\u9fff]|[^\u3400-\u9fff]+',text))
    values=pinyin(text,style=Style.TONE,heteronym=False)
    assert len(tokens)==len(values), 'Pinyin alignment failed: '+text
    result=[]
    for token,value in zip(tokens,values):
        char=token.group();at=token.start();before=text[:at];after=text[at:]
        reading=value[0]
        if char=='得':
            reading='dé' if after.startswith(('得到','得出','得知','得以')) or before.endswith(('获','赢','取','征')) else 'de'
        elif char=='还':reading='hái'
        elif char=='都':reading='dū' if before.endswith('首') or after.startswith('都市') else 'dōu'
        elif char=='长':reading='zhǎng' if before.endswith(('增','成','校','院','部')) or after.startswith('长辈') else 'cháng'
        elif char=='当':reading='dàng' if after.startswith(('当作','当成','当笑话')) else 'dāng'
        elif char=='只':reading='zhī' if before.endswith(('一','两','三','四','几')) else 'zhǐ'
        elif char=='约':reading='yuē'
        result.append(reading)
    out=' '.join(result).replace(' r','r')
    return re.sub(r'\s+([。，！？：；、])',r'\1',out)
