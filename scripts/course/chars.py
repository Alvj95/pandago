"""
Caracteres con historia: descomposición de cada carácter del curso en sus
componentes, con significado en español y una historia para recordarlo.

  python3 scripts/course/chars.py   → src/data/chars/chars.json

La estructura (componentes, tipo de carácter, parte semántica y fonética)
sale de Make Me a Hanzi (github.com/skishore/makemeahanzi, dictionary.txt,
LGPL). Los significados de los componentes y las historias están escritos
en español para PandaGO! (RAD y STORY abajo).
"""
import json, os, re, sys, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
CACHE = os.path.join(HERE, '.cache', 'makemeahanzi-dictionary.txt')
OUT = os.path.join(ROOT, 'src', 'data', 'chars', 'chars.json')

if not os.path.exists(CACHE):
    os.makedirs(os.path.dirname(CACHE), exist_ok=True)
    urllib.request.urlretrieve('https://raw.githubusercontent.com/skishore/makemeahanzi/master/dictionary.txt', CACHE)

# Significado de los componentes (forma que aparece dentro del carácter).
RAD = {
 '亻': 'persona', '人': 'persona', '儿': 'piernas, persona', '女': 'mujer', '子': 'niño', '口': 'boca', '囗': 'recinto, muro', '日': 'sol, día',
 '曰': 'decir', '月': 'luna; carne, cuerpo', '⺼': 'carne, cuerpo', '木': 'árbol, madera', '氵': 'agua', '水': 'agua', '冫': 'hielo', '火': 'fuego', '灬': 'fuego',
 '土': 'tierra', '王': 'rey; jade', '玉': 'jade', '心': 'corazón', '忄': 'corazón', '手': 'mano', '扌': 'mano', '又': 'mano (otra vez)', '寸': 'mano, pulgada',
 '讠': 'palabras, hablar', '言': 'palabras', '辶': 'caminar', '彳': 'paso', '足': 'pie', '止': 'pie, detenerse', '走': 'andar', '目': 'ojo', '见': 'ver',
 '耳': 'oreja', '宀': 'techo, casa', '冖': 'tapa', '广': 'tejado, edificio', '门': 'puerta', '户': 'puerta, casa', '穴': 'cueva', '田': 'campo',
 '力': 'fuerza', '刂': 'cuchillo', '刀': 'cuchillo', '⺈': 'cuchillo (forma estrecha)', '斤': 'hacha', '戈': 'lanza', '弓': 'arco', '矢': 'flecha',
 '钅': 'metal', '纟': 'seda, hilo', '糸': 'seda, hilo', '衣': 'ropa', '巾': 'tela, pañuelo', '饣': 'comida', '米': 'arroz', '禾': 'cereal, grano',
 '艹': 'hierba, planta', '⺮': 'bambú', '竹': 'bambú', '鸟': 'pájaro', '隹': 'pájaro', '马': 'caballo', '牛': 'buey', '羊': 'oveja', '犭': 'animal (perro)',
 '虫': 'insecto', '鱼': 'pez', '贝': 'concha, dinero', '页': 'cabeza, página', '首': 'cabeza', '自': 'nariz, uno mismo', '舌': 'lengua', '牙': 'diente',
 '阝': 'colina; ciudad', '山': 'montaña', '石': 'piedra', '雨': 'lluvia', '云': 'nube; decir', '气': 'aire, vapor', '夕': 'atardecer, noche',
 '大': 'grande (persona con los brazos abiertos)', '小': 'pequeño', '⺍': 'pequeño (encima)', '丷': 'dos trazos (separar)', '八': 'ocho; dividir', '十': 'diez; cruz',
 '一': 'uno; línea', '二': 'dos', '厶': 'privado, propio', '匕': 'cuchara; persona agachada', '卜': 'adivinar', '⺊': 'adivinar', '工': 'trabajo, herramienta',
 '己': 'uno mismo', '巴': 'esperar, pegarse', '方': 'cuadrado; dirección', '文': 'escritura', '欠': 'boca abierta, bostezar', '殳': 'golpear', '攵': 'golpear, actuar',
 '爫': 'garra, mano', '父': 'padre', '母': 'madre', '毛': 'pelo', '示': 'altar', '礻': 'altar, espíritu', '疒': 'enfermedad', '立': 'estar de pie',
 '青': 'verde-azul; joven', '音': 'sonido', '非': 'no; alas opuestas', '至': 'llegar', '舟': 'barco', '车': 'vehículo', '干': 'seco; palo',
 '廾': 'dos manos', '夂': 'pie que avanza', '舛': 'pies enfrentados', '凵': 'recipiente abierto', '冂': 'marco, borde', '匸': 'caja', '厂': 'acantilado, cobertizo',
 '卩': 'persona arrodillada', '耂': 'anciano', '覀': 'cubrir', '疋': 'pie', '彐': 'mano (escoba)', '彡': 'pelo, adorno', '丨': 'trazo vertical', '丿': 'trazo inclinado',
 '丶': 'punto', '乙': 'gancho', '乚': 'gancho', '亅': 'gancho', '乛': 'gancho', '亠': 'tapa, cabeza', '几': 'mesita; cuántos', '凡': 'común, todo',
 '天': 'cielo', '夭': 'joven, persona inclinada', '生': 'nacer, vivir', '白': 'blanco', '立刀': 'cuchillo', '且': 'además; altar', '主': 'dueño, principal',
 '也': 'también', '尔': 'tú', '各': 'cada', '合': 'juntar', '可': 'poder', '只': 'solo', '另': 'otro', '台': 'plataforma', '召': 'llamar', '句': 'frase',
 '令': 'orden', '先': 'antes, primero', '免': 'evitar', '关': 'cerrar; relación', '其': 'eso, su', '取': 'tomar', '友': 'amigo', '反': 'al revés',
 '故': 'causa; antiguo', '更': 'más; cambiar', '本': 'raíz, origen', '未': 'todavía no', '果': 'fruta', '此': 'esto', '永': 'eterno', '求': 'pedir',
 '直': 'recto', '相': 'mutuo', '者': 'el que', '采': 'recoger', '昔': 'antiguamente', '易': 'fácil; cambiar', '景': 'paisaje', '昌': 'próspero',
 '弟': 'hermano menor', '哥': 'hermano mayor', '包': 'envolver', '加': 'añadir', '平': 'plano', '布': 'tela', '式': 'forma, estilo', '亡': 'morir, perder',
 '交': 'cruzar', '京': 'capital', '亲': 'pariente; árbol', '官': 'oficial', '尚': 'todavía; alto', '求': 'pedir', '才': 'talento', '执': 'sujetar',
 '卖': 'vender', '买': 'comprar', '完': 'terminar', '是': 'ser', '包': 'envolver', '那': 'eso', '你': 'tú', '头': 'cabeza', '下': 'abajo', '上': 'arriba',
 '中': 'centro', '长': 'largo', '自': 'nariz, uno mismo', '井': 'pozo', '兆': 'presagio', '兑': 'cambiar', '乍': 'de repente', '占': 'ocupar; adivinar',
 '令': 'orden', '冉': 'colgar, avanzar despacio', '帀': 'dar la vuelta', '旦': 'amanecer', '夬': 'decidir', '艮': 'firme', '矦': 'marqués', '壴': 'tambor',
 '无': 'no tener', '無': 'no tener', '斥': 'reprochar', '斿': 'ondear', '邦': 'país', '舌': 'lengua', '豕': 'cerdo', '约': 'cita, aproximado', '射': 'disparar',
 '吾': 'yo (antiguo)', '曷': '¿qué? (antiguo)', '曼': 'largo, elegante', '畏': 'temer', '监': 'vigilar', '垂': 'colgar', '苗': 'brote', '董': 'dirigir',
 '孝': 'respeto a los padres', '彦': 'erudito', '奇': 'raro', '尤': 'especialmente', '尼': 'monja', '卓': 'alto, destacado', '屮': 'brote', '仌': 'hielo',
 '禸': 'huella', '兀': 'alto', '冋': 'ventana', '冏': 'ventana luminosa', '卬': 'mirar arriba', '乃': 'ser, entonces', '乂': 'cortar', '勺': 'cucharón',
 '勿': 'no (prohibición)', '乞': 'pedir', '丁': 'clavo', '丂': 'aliento', '丄': 'arriba', '与': 'y, dar', '丙': 'tercero', '丩': 'enredar', '刖': 'cortar',
 '凶': 'feroz', '亥': 'cerdo (zodiaco)', '戋': 'pequeño, poco', '殳': 'golpear', '矢': 'flecha', '亍': 'paso corto', '氏': 'clan', '永': 'eterno',
}

# Historias para recordar (pictogramas e ideogramas más útiles).
STORY = {
 '人': 'Dibujo de una persona caminando: dos piernas.', '大': 'Una persona con los brazos bien abiertos: ¡así de grande!',
 '小': 'Un trazo en medio y dos puntitos que se separan: algo muy pequeño.', '女': 'Una mujer arrodillada, con los brazos cruzados.',
 '子': 'Un bebé envuelto en una manta, con los brazos fuera.', '口': 'Una boca abierta (o una caja). Aparece en muchos caracteres de hablar.',
 '日': 'Dibujo del sol: un círculo con un punto en medio (luego se hizo cuadrado).', '月': 'Una luna creciente.',
 '水': 'Un río que corre en medio y gotas a los lados.', '火': 'Llamas que suben de una hoguera.', '木': 'Un árbol: tronco, ramas y raíces.',
 '山': 'Tres picos de montaña.', '雨': 'Gotas de lluvia que caen de una nube.', '门': 'La puerta abierta de una casa.',
 '手': 'Una mano con los dedos abiertos.', '目': 'Un ojo puesto de pie.', '米': 'Granos de arroz esparcidos alrededor de una espiga.',
 '鱼': 'Un pez nadando hacia arriba: cabeza, cuerpo con escamas y cola.', '羊': 'La cabeza de una oveja con sus cuernos.',
 '牛': 'La cabeza de un buey con sus cuernos.', '车': 'Un carro visto desde arriba: el eje y las ruedas.', '飞': 'Un pájaro batiendo las alas.',
 '衣': 'Una prenda de ropa con el cuello arriba.', '肉': 'Un trozo de carne con sus vetas.', '瓜': 'Una planta con un melón colgando.',
 '自': 'Una nariz: en China la gente se señala la nariz al decir «yo».', '身': 'El perfil de una persona con barriga: el cuerpo.',
 '高': 'Un edificio alto de varios pisos con su tejado.', '京': 'Un gran edificio sobre una colina: la capital.', '老': 'Una persona mayor, encorvada y con el pelo largo.',
 '儿': 'Las piernas de un niño que empieza a andar.', '几': 'Una mesita baja.', '工': 'Una herramienta de trabajo (como una regla de carpintero).',
 '西': 'Un pájaro posándose en su nido al atardecer, cuando el sol se va por el oeste.', '东': 'El sol saliendo detrás de un árbol: por el este.',
 '北': 'Dos personas sentadas de espaldas: dar la espalda al norte frío.', '面': 'La cara de una persona.', '亮': 'Una lámpara encendida bajo un techo: luz.',
 '元': 'Una persona con dos rayas sobre la cabeza: lo primero, el origen.', '左': 'Una mano izquierda sujetando una herramienta 工.',
 '再': 'Dos peces colgados de una cuerda: «otra vez» uno más.', '九': 'Un brazo doblado por el codo.', '少': 'Pequeño 小 con un trazo que quita: poco.',
 '能': 'Un oso (cabeza, cuerpo y garras): fuerte, que puede.', '离': 'Un animal de pie. Hoy significa «separarse, distancia».', '了': 'Un niño envuelto sin brazos: algo ya terminado.',
 '好': 'Una mujer 女 con su niño 子: ¡eso es algo bueno!', '你': 'Una persona 亻 a la que llamas 尔 «tú».', '我': 'Una mano 扌 que sujeta una lanza 戈: «yo» me defiendo.',
 '他': 'Una persona 亻 que también 也 está: «él».', '她': 'Una mujer 女 que también 也 está: «ella».', '是': 'El sol 日 sobre un pie 疋 recto: lo correcto, «ser».',
 '字': 'Un niño 子 en casa 宀 aprendiendo a escribir: carácter.', '名': 'De noche 夕 no se ve, hay que decir con la boca 口 tu nombre.',
 '多': 'Dos noches 夕 seguidas: muchas.', '朋': 'Dos lunas 月 una al lado de la otra: compañeros.', '友': 'Dos manos 又 que se dan: amigo.',
 '学': 'Un niño 子 bajo un techo 冖 donde se estudia.', '果': 'Fruta 田 colgando de un árbol 木.', '休': 'Una persona 亻 apoyada en un árbol 木: descansar.',
 '明': 'El sol 日 y la luna 月 juntos: brillante, claro.', '天': 'Lo que está por encima 一 de una persona grande 大: el cielo.',
 '上': 'Una línea por encima de la base: arriba.', '下': 'Una línea por debajo de la base: abajo.', '中': 'Una línea que atraviesa el centro de una caja: medio.',
 '国': 'Un tesoro 玉 dentro de las fronteras 囗: un país.', '出': 'Un brote 屮 que sale de un recipiente 凵: salir.', '回': 'Una espiral que vuelve al centro: volver.',
 '坐': 'Dos personas 人人 sentadas en el suelo 土.', '看': 'Una mano 手 sobre el ojo 目 para ver mejor: mirar.', '听': 'Palabras de la boca 口 que llegan al oído: escuchar.',
 '会': 'Personas 人 que se reúnen a hablar 云: reunión, saber.', '本': 'Un árbol 木 con una raya en la raíz: origen, libro.', '男': 'Fuerza 力 en el campo 田: hombre.',
 '早': 'El sol 日 asomando sobre el horizonte 十: temprano.', '间': 'El sol 日 que se ve por la puerta 门: espacio, entre.', '从': 'Una persona 人 que sigue a otra 人.',
 '走': 'Un pie 止 que se mueve sobre la tierra 土: andar.', '告': 'Un buey 牛 sobre una boca 口: anunciar con fuerza.', '比': 'Dos personas 匕匕 una al lado de la otra: comparar.',
 '笑': 'El bambú ⺮ se dobla como una persona 夭 riéndose.', '爱': 'Una mano 爫 que lleva a un amigo 友 bajo el techo 冖: amor.', '家': 'Un cerdo 豕 bajo el techo 宀: en el campo, casa y familia.',
 '喜': 'Tambores 壴 y bocas 口 cantando: alegría.', '休息': '', '电': 'Un rayo que sale de una nube: electricidad.', '开': 'Dos manos 廾 que levantan la barra de la puerta: abrir.',
 '白': 'La luz de una vela o del sol: blanco.', '黑': 'Una cara manchada de hollín por el fuego 灬: negro.', '新': 'Madera recién cortada con el hacha 斤: nuevo.',
 '真': 'Algo recto 直 sobre una mesa 几: verdadero.', '最': 'Coger 取 bajo el sol 日 lo mejor de todo: el más.', '您': 'Tú 你 dicho con el corazón 心: usted.',
 '早上': '', '息': 'El aire que pasa por la nariz 自 hasta el corazón 心: respirar, descansar.', '正': 'Un pie 止 que se para justo en la línea 一: correcto.',
 '忙': 'El corazón 忄 que se pierde 亡: estar muy ocupado.', '两': 'Dos personas 从 dentro de un carro: dos.', '鸡': 'Otro 又 tipo de pájaro 鸟: el pollo.',
 '找': 'Una mano 扌 con una lanza 戈 buscando: buscar.', '共': 'Dos manos 八 sujetando algo juntas: común.', '行': 'Pasos 彳 y más pasos 亍: caminar, ir bien.',
 '外': 'Adivinar 卜 de noche 夕 lo de fuera: exterior.', '步': 'Un pie 止 delante del otro: paso.', '游': 'Agua 氵 y una bandera que ondea: nadar, pasear.',
 '旅': 'Una bandera 方 y personas que la siguen: viaje.', '思': 'El campo 田 (la cabeza) sobre el corazón 心: pensar.', '表': 'Ropa 衣 de pelo 毛: lo de fuera; también reloj.',
 '望': 'Un rey 王 que mira la luna 月: mirar a lo lejos, esperar.', '别': 'Un cuchillo 刂 que separa: no, otro.', '次': 'Una persona que bosteza 欠 dos veces 冫: vez.',
 '第': 'Tiras de bambú ⺮ puestas en orden: el ordinal.', '还': 'No 不 se va, se queda caminando 辶: todavía, volver.', '所': 'Un hacha 斤 junto a la puerta 户: lugar.',
 '要': 'Una mujer 女 con las manos en la cintura: querer, necesitar.', '阴': 'La colina 阝 a la sombra de la luna 月: nublado.', '晴': 'Sol 日 y cielo azul 青: despejado.',
 '雪': 'Lluvia 雨 que se puede barrer con la mano 彐: nieve.', '妈': 'Una mujer 女 + el sonido de 马 mǎ: mā, mamá.', '吗': 'Una boca 口 + el sonido de 马: ma, la partícula de pregunta.',
 '们': 'Una persona 亻 + el sonido de 门 mén: men, el plural.', '吃': 'La boca 口 + el sonido de 乞 qǐ: chī, comer.', '喝': 'La boca 口 + el sonido de 曷: hē, beber.',
 '想': 'Mirar mutuamente 相 con el corazón 心: pensar, querer.', '谢': 'Palabras 讠 + el sonido de 射 shè: xiè, gracias.', '说': 'Palabras 讠 + 兑: shuō, hablar.',
 '话': 'Palabras 讠 y la lengua 舌: habla.', '语': 'Palabras 讠 + el sonido de 吾 wú: yǔ, idioma.', '茶': 'Una planta 艹, una persona 人 y un árbol 木: el té.',
 '休闲': '', '岁': 'Una montaña 山 sobre la noche 夕: los años que pasan.', '买': 'Una red 乛 sobre la cabeza 头… para llevarse lo comprado: comprar.',
 '卖': 'Comprar 买 con un 十 encima: lo que sale de la tienda, vender.', '去': 'Tierra 土 que se deja atrás 厶: ir.', '这': 'Caminar 辶 hacia la escritura 文 que señalas: esto.',
 '前': 'Barco y cuchillo: avanzar cortando el agua, delante.', '因': 'Una persona grande 大 dentro de un recinto 囗: causa, porque.', '为': 'Fuerza 力 con dos puntos: hacer, para.',
 '以': 'Una persona 人 con una herramienta: con, por medio de.', '答': 'Bambú ⺮ que se junta 合: responder.', '体': 'Persona 亻 + raíz 本: el cuerpo.',
 '便': 'Una persona 亻 que cambia 更 las cosas para que sea fácil: cómodo, barato.', '着': 'Una oveja 羊 vista por el ojo 目: la partícula de estado continuo.',
}
STORY = {k: v for k, v in STORY.items() if v and len(k) == 1}

IDC = set('⿰⿱⿲⿳⿴⿵⿶⿷⿸⿹⿺⿻')

def main():
    D = {}
    for line in open(CACHE, encoding='utf-8'):
        j = json.loads(line)
        D[j['character']] = j
    src = open(os.path.join(ROOT, 'src', 'data', 'hsk', 'course.ts'), encoding='utf-8').read()
    vocab = json.loads(re.search(r'export const VOCAB: VocabItem\[\] = (\[.*?\]);\n', src, re.S).group(1))
    single = {v['hanzi']: v for v in vocab if len(v['hanzi']) == 1}
    order = []
    for v in vocab:
        for ch in v['hanzi']:
            if ch not in order: order.append(ch)

    def meaning(c):
        if c in RAD: return RAD[c]
        if c in single: return single[c]['meaning']
        return None

    def pinyin(c):
        if c in single: return single[c]['pinyin']
        return (D.get(c, {}).get('pinyin') or [None])[0]

    out, missing = {}, []
    for ch in order:
        j = D.get(ch)
        if not j:
            missing.append(ch); continue
        parts = []
        for p in j['decomposition']:
            if p in IDC or p == '？' or p == ch: continue
            parts.append({k: v for k, v in dict(c=p, es=meaning(p), py=pinyin(p)).items() if v})
        ety = j.get('etymology') or {}
        kind = ety.get('type') or 'other'
        words = [v for v in vocab if ch in v['hanzi'] and len(v['hanzi']) > 1][:3]
        entry = dict(
            py=pinyin(ch) or '',
            es=single[ch]['meaning'] if ch in single else '',
            words=[w['id'] for w in words],
            radical=j.get('radical'),
            kind=kind,
            parts=parts,
        )
        if kind == 'pictophonetic':
            if ety.get('semantic'):
                entry['sem'] = ety['semantic']
                if meaning(ety['semantic']): entry['semEs'] = meaning(ety['semantic'])
            if ety.get('phonetic'):
                entry['pho'] = ety['phonetic']
                if pinyin(ety['phonetic']): entry['phoPy'] = pinyin(ety['phonetic'])
        if ch in STORY: entry['story'] = STORY[ch]
        out[ch] = entry
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    no_meaning = sorted({p['c'] for e in out.values() for p in e['parts'] if 'es' not in p})
    print('caracteres', len(out), 'con historia', sum('story' in e for e in out.values()),
          'pictofonéticos', sum(e['kind'] == 'pictophonetic' for e in out.values()))
    print('componentes sin significado:', ' '.join(no_meaning))
    if missing: print('sin datos:', ' '.join(missing)); sys.exit(1)

main()
