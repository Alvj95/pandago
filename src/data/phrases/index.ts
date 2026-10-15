/**
 * Frases de supervivencia para viajar a China, por situación. Van más allá de
 * HSK 1-2 a propósito: son frases hechas para usar tal cual.
 */

export interface Phrase {
  hanzi: string;
  pinyin: string;
  es: string;
  /** Matiz o consejo de uso. */
  tip?: string;
}

export interface Situation {
  id: string;
  icon: string;
  title: string;
  phrases: Phrase[];
  /** Consejo cultural de la situación. */
  note?: string;
}

const P = (hanzi: string, pinyin: string, es: string, tip?: string): Phrase => ({ hanzi, pinyin, es, ...(tip ? { tip } : {}) });

export const SITUATIONS: Situation[] = [
  {
    id: 'restaurant', icon: '🍜', title: 'En el restaurante',
    note: 'Para llamar al camarero se dice 服务员 en voz alta: no es de mala educación. En muchos sitios se pide escaneando un código QR de la mesa.',
    phrases: [
      P('服务员，点菜！', 'Fúwùyuán, diǎn cài!', '¡Camarero, quiero pedir!'),
      P('有菜单吗？', 'Yǒu càidān ma?', '¿Tiene la carta?'),
      P('我要这个。', 'Wǒ yào zhège.', 'Quiero esto.', 'Señala el plato en la carta mientras lo dices.'),
      P('我不吃辣。', 'Wǒ bù chī là.', 'No como picante.'),
      P('我吃素。', 'Wǒ chī sù.', 'Soy vegetariano/a.'),
      P('请给我一杯水。', 'Qǐng gěi wǒ yì bēi shuǐ.', 'Un vaso de agua, por favor.'),
      P('很好吃！', 'Hěn hǎochī!', '¡Está muy rico!'),
      P('买单！', 'Mǎidān!', '¡La cuenta, por favor!'),
      P('可以用微信付吗？', 'Kěyǐ yòng Wēixìn fù ma?', '¿Puedo pagar con WeChat?'),
    ],
  },
  {
    id: 'taxi', icon: '🚕', title: 'En taxi',
    note: 'A los taxistas se les llama 师傅 (shīfu, «maestro»). Lleva la dirección escrita en caracteres para enseñarla.',
    phrases: [
      P('师傅，去这个地方。', 'Shīfu, qù zhège dìfang.', 'Conductor, a este sitio, por favor.', 'Enseña la dirección en el móvil.'),
      P('去机场多少钱？', 'Qù jīchǎng duōshao qián?', '¿Cuánto cuesta ir al aeropuerto?'),
      P('请开慢一点儿。', 'Qǐng kāi màn yìdiǎnr.', 'Más despacio, por favor.'),
      P('在这儿停。', 'Zài zhèr tíng.', 'Pare aquí.'),
      P('请打表。', 'Qǐng dǎ biǎo.', 'Ponga el taxímetro, por favor.'),
      P('到了吗？', 'Dào le ma?', '¿Hemos llegado?'),
      P('我要发票。', 'Wǒ yào fāpiào.', 'Quiero el recibo.'),
    ],
  },
  {
    id: 'shopping', icon: '🛍️', title: 'De compras',
    note: 'En mercados y tiendas pequeñas se regatea; en centros comerciales, no.',
    phrases: [
      P('这个多少钱？', 'Zhège duōshao qián?', '¿Cuánto cuesta esto?'),
      P('太贵了！便宜一点儿吧。', 'Tài guì le! Piányi yìdiǎnr ba.', '¡Es muy caro! Hágame un descuento.'),
      P('我只是看看。', 'Wǒ zhǐshì kànkan.', 'Solo estoy mirando.'),
      P('有大一点儿的吗？', 'Yǒu dà yìdiǎnr de ma?', '¿Tiene una talla más grande?'),
      P('我可以试试吗？', 'Wǒ kěyǐ shìshi ma?', '¿Me lo puedo probar?'),
      P('我要两个。', 'Wǒ yào liǎng gè.', 'Quiero dos.'),
      P('可以刷卡吗？', 'Kěyǐ shuā kǎ ma?', '¿Se puede pagar con tarjeta?'),
    ],
  },
  {
    id: 'hotel', icon: '🏨', title: 'En el hotel',
    phrases: [
      P('我订了一个房间。', 'Wǒ dìng le yí gè fángjiān.', 'Tengo una habitación reservada.'),
      P('这是我的护照。', 'Zhè shì wǒ de hùzhào.', 'Este es mi pasaporte.'),
      P('有无线网吗？', 'Yǒu wúxiàn wǎng ma?', '¿Hay wifi?'),
      P('密码是多少？', 'Mìmǎ shì duōshao?', '¿Cuál es la contraseña?'),
      P('几点吃早饭？', 'Jǐ diǎn chī zǎofàn?', '¿A qué hora es el desayuno?'),
      P('房间里没有热水。', 'Fángjiān lǐ méiyǒu rè shuǐ.', 'No hay agua caliente en la habitación.'),
      P('我想退房。', 'Wǒ xiǎng tuì fáng.', 'Quiero dejar la habitación (check-out).'),
    ],
  },
  {
    id: 'directions', icon: '🧭', title: 'Orientarse',
    phrases: [
      P('请问，地铁站在哪儿？', 'Qǐngwèn, dìtiězhàn zài nǎr?', 'Disculpe, ¿dónde está el metro?', '请问 («permítame preguntar») es la forma educada de empezar.'),
      P('洗手间在哪儿？', 'Xǐshǒujiān zài nǎr?', '¿Dónde está el baño?'),
      P('远吗？', 'Yuǎn ma?', '¿Está lejos?'),
      P('一直走，然后左拐。', 'Yìzhí zǒu, ránhòu zuǒ guǎi.', 'Todo recto y luego a la izquierda.'),
      P('我迷路了。', 'Wǒ mílù le.', 'Me he perdido.'),
      P('你能在地图上指给我看吗？', 'Nǐ néng zài dìtú shang zhǐ gěi wǒ kàn ma?', '¿Me lo puede señalar en el mapa?'),
    ],
  },
  {
    id: 'talk', icon: '💬', title: 'Cuando no entiendes',
    phrases: [
      P('我不会说中文。', 'Wǒ bú huì shuō Zhōngwén.', 'No hablo chino.'),
      P('我听不懂。', 'Wǒ tīng bu dǒng.', 'No lo entiendo (al oírlo).'),
      P('请再说一遍。', 'Qǐng zài shuō yí biàn.', 'Repítalo, por favor.'),
      P('请说慢一点儿。', 'Qǐng shuō màn yìdiǎnr.', 'Hable más despacio, por favor.'),
      P('你会说英语吗？', 'Nǐ huì shuō Yīngyǔ ma?', '¿Habla inglés?'),
      P('这个用中文怎么说？', 'Zhège yòng Zhōngwén zěnme shuō?', '¿Cómo se dice esto en chino?'),
      P('请写下来。', 'Qǐng xiě xiàlai.', 'Escríbalo, por favor.'),
    ],
  },
  {
    id: 'emergency', icon: '🆘', title: 'Emergencias',
    note: 'Teléfonos en China: 110 policía, 120 ambulancia, 119 bomberos.',
    phrases: [
      P('救命！', 'Jiùmìng!', '¡Socorro!'),
      P('请叫救护车！', 'Qǐng jiào jiùhùchē!', '¡Llame a una ambulancia!'),
      P('我需要看医生。', 'Wǒ xūyào kàn yīshēng.', 'Necesito ver a un médico.'),
      P('我这里疼。', 'Wǒ zhèlǐ téng.', 'Me duele aquí.', 'Señala dónde te duele.'),
      P('我对花生过敏。', 'Wǒ duì huāshēng guòmǐn.', 'Soy alérgico/a a los cacahuetes.'),
      P('我的钱包丢了。', 'Wǒ de qiánbāo diū le.', 'He perdido la cartera.'),
      P('请报警。', 'Qǐng bàojǐng.', 'Llame a la policía, por favor.'),
    ],
  },
  {
    id: 'friends', icon: '🤝', title: 'Hacer amigos',
    note: 'Cambia 西班牙 por tu país: 墨西哥 Mòxīgē (México), 阿根廷 Āgēntíng (Argentina), 哥伦比亚 Gēlúnbǐyà (Colombia), 秘鲁 Bìlǔ (Perú), 智利 Zhìlì (Chile).',
    phrases: [
      P('你好，我是西班牙人。', 'Nǐ hǎo, wǒ shì Xībānyá rén.', 'Hola, soy español/a.'),
      P('我在学中文。', 'Wǒ zài xué Zhōngwén.', 'Estoy aprendiendo chino.'),
      P('你可以加我微信吗？', 'Nǐ kěyǐ jiā wǒ Wēixìn ma?', '¿Me agregas en WeChat?'),
      P('我们一起拍照吧！', 'Wǒmen yìqǐ pāizhào ba!', '¡Hagámonos una foto juntos!'),
      P('干杯！', 'Gānbēi!', '¡Salud! (al brindar)', 'Literalmente «vaso seco»: en un brindis formal se espera vaciar el vaso.'),
      P('谢谢你的帮助。', 'Xièxie nǐ de bāngzhù.', 'Gracias por tu ayuda.'),
      P('下次见！', 'Xià cì jiàn!', '¡Hasta la próxima!'),
    ],
  },
];
