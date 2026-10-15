/**
 * Historias con Bao: un mini cuento por unidad, con el vocabulario de esa
 * unidad (y anteriores). Cada línea se escucha, se puede tocar palabra a
 * palabra y entre líneas hay preguntas de comprensión.
 */

export interface StoryLine {
  /** Quién habla: 'bao' o el nombre del otro personaje. */
  who: 'bao' | string;
  hanzi: string;
  pinyin: string;
  es: string;
}

export interface StoryQuestion {
  /** Se pregunta después de esta línea (índice 0-based). */
  after: number;
  question: string;
  options: string[];
  answer: number;
}

export interface Story {
  id: string;
  unitId: string;
  icon: string;
  title: string;
  /** Personaje con el que habla Bao (para el avatar). */
  partner: { name: string; icon: string };
  lines: StoryLine[];
  questions: StoryQuestion[];
}

const L = (who: string, hanzi: string, pinyin: string, es: string): StoryLine => ({ who, hanzi, pinyin, es });

/** Primera historia de cada unidad. */
const MAIN: Story[] = [
  {
    id: 's1', unitId: 'u1', icon: '👋', title: 'Bao conoce a Xiao Wang', partner: { name: '小王', icon: '🧑' },
    lines: [
      L('bao', '你好！', 'Nǐ hǎo!', '¡Hola!'),
      L('小王', '你好！你叫什么名字？', 'Nǐ hǎo! Nǐ jiào shénme míngzi?', '¡Hola! ¿Cómo te llamas?'),
      L('bao', '我叫宝宝。你呢？', 'Wǒ jiào Bǎobao. Nǐ ne?', 'Me llamo Baobao. ¿Y tú?'),
      L('小王', '我叫小王。我是学生。', 'Wǒ jiào Xiǎo Wáng. Wǒ shì xuésheng.', 'Me llamo Xiao Wang. Soy estudiante.'),
      L('bao', '认识你很高兴！', 'Rènshi nǐ hěn gāoxìng!', '¡Encantado de conocerte!'),
      L('小王', '我也很高兴。', 'Wǒ yě hěn gāoxìng.', 'Yo también estoy encantado.'),
      L('bao', '谢谢你！再见！', 'Xièxie nǐ! Zàijiàn!', '¡Gracias! ¡Adiós!'),
      L('小王', '不客气，再见！', 'Bú kèqi, zàijiàn!', '¡De nada, adiós!'),
    ],
    questions: [
      { after: 3, question: '¿Cómo se llama Bao en chino?', options: ['Baobao', 'Xiao Wang', 'Wang'], answer: 0 },
      { after: 5, question: '¿Qué es Xiao Wang?', options: ['Profesor', 'Estudiante', 'Médico'], answer: 1 },
    ],
  },
  {
    id: 's2', unitId: 'u2', icon: '🔢', title: '¿Cuántos amigos tienes?', partner: { name: '小王', icon: '🧑' },
    lines: [
      L('小王', '宝宝，你几岁？', 'Bǎobao, nǐ jǐ suì?', 'Baobao, ¿cuántos años tienes?'),
      L('bao', '我五岁。你呢？', 'Wǒ wǔ suì. Nǐ ne?', 'Tengo cinco años. ¿Y tú?'),
      L('小王', '我二十岁。', 'Wǒ èrshí suì.', 'Tengo veinte años.'),
      L('bao', '你有几个朋友？', 'Nǐ yǒu jǐ gè péngyou?', '¿Cuántos amigos tienes?'),
      L('小王', '我有八个朋友。', 'Wǒ yǒu bā gè péngyou.', 'Tengo ocho amigos.'),
      L('bao', '我有一百个朋友！', 'Wǒ yǒu yìbǎi gè péngyou!', '¡Yo tengo cien amigos!'),
      L('小王', '一百个？太多了！', 'Yìbǎi gè? Tài duō le!', '¿Cien? ¡Son muchísimos!'),
    ],
    questions: [
      { after: 2, question: '¿Cuántos años tiene Xiao Wang?', options: ['5', '8', '20'], answer: 2 },
      { after: 6, question: '¿Cuántos amigos dice tener Bao?', options: ['100', '8', '5'], answer: 0 },
    ],
  },
  {
    id: 's3', unitId: 'u3', icon: '🏠', title: 'La familia de Bao', partner: { name: '小王', icon: '🧑' },
    lines: [
      L('小王', '这是谁？', 'Zhè shì shéi?', '¿Quién es esta?'),
      L('bao', '这是我妈妈。她是医生。', 'Zhè shì wǒ māma. Tā shì yīshēng.', 'Es mi madre. Es médica.'),
      L('小王', '那是你爸爸吗？', 'Nà shì nǐ bàba ma?', '¿Y ese es tu padre?'),
      L('bao', '不是，那是我的老师。', 'Bú shì, nà shì wǒ de lǎoshī.', 'No, ese es mi profesor.'),
      L('小王', '你家有几个人？', 'Nǐ jiā yǒu jǐ gè rén?', '¿Cuántos sois en tu familia?'),
      L('bao', '我家有三个人：爸爸、妈妈和我。', 'Wǒ jiā yǒu sān gè rén: bàba, māma hé wǒ.', 'Somos tres: papá, mamá y yo.'),
      L('bao', '我很爱我的家！', 'Wǒ hěn ài wǒ de jiā!', '¡Quiero mucho a mi familia!'),
    ],
    questions: [
      { after: 1, question: '¿En qué trabaja la madre de Bao?', options: ['Profesora', 'Médica', 'Estudiante'], answer: 1 },
      { after: 5, question: '¿Cuántas personas hay en la familia de Bao?', options: ['2', '3', '4'], answer: 1 },
    ],
  },
  {
    id: 's4', unitId: 'u4', icon: '🍚', title: 'En el restaurante', partner: { name: '服务员', icon: '🙋' },
    lines: [
      L('服务员', '你好！你想吃什么？', 'Nǐ hǎo! Nǐ xiǎng chī shénme?', '¡Hola! ¿Qué quieres comer?'),
      L('bao', '我想吃米饭。', 'Wǒ xiǎng chī mǐfàn.', 'Quiero arroz.'),
      L('服务员', '你想喝什么？', 'Nǐ xiǎng hē shénme?', '¿Qué quieres beber?'),
      L('bao', '我想喝茶。', 'Wǒ xiǎng hē chá.', 'Quiero té.'),
      L('bao', '我也想吃苹果。苹果多少钱？', 'Wǒ yě xiǎng chī píngguǒ. Píngguǒ duōshao qián?', 'También quiero manzanas. ¿Cuánto cuestan?'),
      L('服务员', '三块钱。', 'Sān kuài qián.', 'Tres yuanes.'),
      L('bao', '好，谢谢！', 'Hǎo, xièxie!', '¡Vale, gracias!'),
    ],
    questions: [
      { after: 3, question: '¿Qué quiere beber Bao?', options: ['Agua', 'Té', 'Nada'], answer: 1 },
      { after: 5, question: '¿Cuánto cuestan las manzanas?', options: ['3 yuanes', '10 yuanes', '30 yuanes'], answer: 0 },
    ],
  },
  {
    id: 's5', unitId: 'u5', icon: '🌦️', title: '¿Qué tiempo hace?', partner: { name: '小王', icon: '🧑' },
    lines: [
      L('小王', '今天天气怎么样？', 'Jīntiān tiānqì zěnmeyàng?', '¿Qué tal el tiempo hoy?'),
      L('bao', '今天很热。', 'Jīntiān hěn rè.', 'Hoy hace mucho calor.'),
      L('小王', '明天呢？', 'Míngtiān ne?', '¿Y mañana?'),
      L('bao', '明天下雨。', 'Míngtiān xià yǔ.', 'Mañana llueve.'),
      L('小王', '现在几点？', 'Xiànzài jǐ diǎn?', '¿Qué hora es?'),
      L('bao', '现在下午三点。', 'Xiànzài xiàwǔ sān diǎn.', 'Son las tres de la tarde.'),
      L('小王', '太好了！我们去喝茶吧！', 'Tài hǎo le! Wǒmen qù hē chá ba!', '¡Genial! ¡Vamos a tomar un té!'),
    ],
    questions: [
      { after: 3, question: '¿Qué tiempo hará mañana?', options: ['Calor', 'Lloverá', 'Frío'], answer: 1 },
      { after: 5, question: '¿Qué hora es?', options: ['Las 3 de la tarde', 'Las 3 de la mañana', 'Mediodía'], answer: 0 },
    ],
  },
  {
    id: 's6', unitId: 'u6', icon: '🚕', title: 'En taxi por Pekín', partner: { name: '先生', icon: '🧔' },
    lines: [
      L('先生', '你好！你去哪里？', 'Nǐ hǎo! Nǐ qù nǎlǐ?', '¡Hola! ¿Adónde vas?'),
      L('bao', '我去火车站。', 'Wǒ qù huǒchēzhàn.', 'Voy a la estación de tren.'),
      L('先生', '好。你住在北京吗？', 'Hǎo. Nǐ zhù zài Běijīng ma?', 'Vale. ¿Vives en Pekín?'),
      L('bao', '是，我住在学校里。', 'Shì, wǒ zhù zài xuéxiào lǐ.', 'Sí, vivo en la escuela.'),
      L('先生', '火车站在医院后面。', 'Huǒchēzhàn zài yīyuàn hòumiàn.', 'La estación está detrás del hospital.'),
      L('先生', '到了！', 'Dào le!', '¡Ya hemos llegado!'),
      L('bao', '谢谢先生！再见！', 'Xièxie xiānsheng! Zàijiàn!', '¡Gracias, señor! ¡Adiós!'),
    ],
    questions: [
      { after: 1, question: '¿Adónde va Bao?', options: ['Al hospital', 'A la estación de tren', 'A la escuela'], answer: 1 },
      { after: 4, question: '¿Dónde está la estación?', options: ['Detrás del hospital', 'Delante de la escuela', 'En el aeropuerto'], answer: 0 },
    ],
  },
  {
    id: 's7', unitId: 'u7', icon: '📚', title: '¿Qué estás haciendo?', partner: { name: '小王', icon: '🧑' },
    lines: [
      L('小王', '宝宝，你在做什么？', 'Bǎobao, nǐ zài zuò shénme?', 'Baobao, ¿qué estás haciendo?'),
      L('bao', '我在学习汉语。', 'Wǒ zài xuéxí Hànyǔ.', 'Estoy estudiando chino.'),
      L('小王', '你会写这个字吗？', 'Nǐ huì xiě zhège zì ma?', '¿Sabes escribir este carácter?'),
      L('bao', '会！我每天写字。', 'Huì! Wǒ měi tiān xiě zì.', '¡Sí! Escribo caracteres todos los días.'),
      L('小王', '晚上你看电视吗？', 'Wǎnshang nǐ kàn diànshì ma?', '¿Ves la tele por la noche?'),
      L('bao', '不看。我喜欢看电影。', 'Bú kàn. Wǒ xǐhuan kàn diànyǐng.', 'No. Me gusta ver películas.'),
      L('小王', '我也喜欢！我们去看电影吧！', 'Wǒ yě xǐhuan! Wǒmen qù kàn diànyǐng ba!', '¡A mí también! ¡Vamos al cine!'),
    ],
    questions: [
      { after: 1, question: '¿Qué está haciendo Bao?', options: ['Ver la tele', 'Estudiar chino', 'Dormir'], answer: 1 },
      { after: 5, question: '¿Qué le gusta ver a Bao?', options: ['Películas', 'La tele', 'Libros'], answer: 0 },
    ],
  },
  {
    id: 's8', unitId: 'u8', icon: '🐱', title: 'El gato de Xiao Wang', partner: { name: '小王', icon: '🧑' },
    lines: [
      L('小王', '你看！这是我的猫。', 'Nǐ kàn! Zhè shì wǒ de māo.', '¡Mira! Este es mi gato.'),
      L('bao', '你的猫很漂亮！它叫什么名字？', 'Nǐ de māo hěn piàoliang! Tā jiào shénme míngzi?', '¡Tu gato es muy bonito! ¿Cómo se llama?'),
      L('小王', '它叫小白。', 'Tā jiào Xiǎo Bái.', 'Se llama Xiaobai.'),
      L('bao', '小白在椅子上。', 'Xiǎo Bái zài yǐzi shang.', 'Xiaobai está en la silla.'),
      L('小王', '你有猫吗？', 'Nǐ yǒu māo ma?', '¿Tienes gato?'),
      L('bao', '没有。我有一些书。', 'Méiyǒu. Wǒ yǒu yìxiē shū.', 'No. Tengo algunos libros.'),
      L('小王', '书和猫都很好！', 'Shū hé māo dōu hěn hǎo!', '¡Los libros y los gatos están genial!'),
    ],
    questions: [
      { after: 2, question: '¿Cómo se llama el gato?', options: ['Baobao', 'Xiaobai', 'Xiao Wang'], answer: 1 },
      { after: 5, question: '¿Tiene Bao un gato?', options: ['No, tiene libros', 'Sí', 'Tiene un perro'], answer: 0 },
    ],
  },
  {
    id: 's9', unitId: 'u9', icon: '👕', title: 'Ropa nueva', partner: { name: '小王', icon: '🧑' },
    lines: [
      L('bao', '你看，我的新衣服！', 'Nǐ kàn, wǒ de xīn yīfu!', '¡Mira, mi ropa nueva!'),
      L('小王', '真漂亮！是红的。', 'Zhēn piàoliang! Shì hóng de.', '¡Qué bonita! Es roja.'),
      L('bao', '我最喜欢红的。', 'Wǒ zuì xǐhuan hóng de.', 'El rojo es mi favorito.'),
      L('小王', '贵吗？', 'Guì ma?', '¿Es cara?'),
      L('bao', '不贵，非常便宜！', 'Bú guì, fēicháng piányi!', '¡No, es baratísima!'),
      L('小王', '我也想买！商店远吗？', 'Wǒ yě xiǎng mǎi! Shāngdiàn yuǎn ma?', '¡Yo también quiero comprar! ¿Está lejos la tienda?'),
      L('bao', '不远，很近。', 'Bù yuǎn, hěn jìn.', 'No, está muy cerca.'),
    ],
    questions: [
      { after: 2, question: '¿De qué color es la ropa?', options: ['Blanca', 'Negra', 'Roja'], answer: 2 },
      { after: 4, question: '¿Es cara la ropa?', options: ['No, es muy barata', 'Sí, muy cara', 'No lo dice'], answer: 0 },
    ],
  },
  {
    id: 's10', unitId: 'u10', icon: '🎂', title: 'El cumpleaños de Bao', partner: { name: '小王', icon: '🧑' },
    lines: [
      L('小王', '宝宝，生日快乐！', 'Bǎobao, shēngrì kuàilè!', '¡Feliz cumpleaños, Baobao!'),
      L('bao', '谢谢！欢迎你来我家！', 'Xièxie! Huānyíng nǐ lái wǒ jiā!', '¡Gracias! ¡Bienvenido a mi casa!'),
      L('bao', '我介绍一下：这是我姐姐。', 'Wǒ jièshào yíxià: zhè shì wǒ jiějie.', 'Os presento: esta es mi hermana mayor.'),
      L('姐姐', '你好！你姓什么？', 'Nǐ hǎo! Nǐ xìng shénme?', '¡Hola! ¿Cómo te apellidas?'),
      L('小王', '我姓王。您好！', 'Wǒ xìng Wáng. Nín hǎo!', 'Me apellido Wang. ¡Encantado!'),
      L('bao', '我还有两个弟弟。', 'Wǒ hái yǒu liǎng gè dìdi.', 'También tengo dos hermanos pequeños.'),
      L('小王', '你们家人真多！', 'Nǐmen jiā rén zhēn duō!', '¡Sois muchos en tu familia!'),
    ],
    questions: [
      { after: 3, question: '¿Quién es la chica que presenta Bao?', options: ['Su madre', 'Su hermana mayor', 'Su hermana pequeña'], answer: 1 },
      { after: 6, question: '¿Cuántos hermanos pequeños tiene Bao?', options: ['1', '2', '3'], answer: 1 },
    ],
  },
  {
    id: 's11', unitId: 'u11', icon: '⏰', title: 'Un día muy ocupado', partner: { name: '小王', icon: '🧑' },
    lines: [
      L('小王', '你每天几点起床？', 'Nǐ měi tiān jǐ diǎn qǐchuáng?', '¿A qué hora te levantas cada día?'),
      L('bao', '我早上七点起床。', 'Wǒ zǎoshang qī diǎn qǐchuáng.', 'Me levanto a las siete de la mañana.'),
      L('小王', '你几点上班？', 'Nǐ jǐ diǎn shàngbān?', '¿A qué hora entras a trabajar?'),
      L('bao', '八点。我在公司工作八个小时。', 'Bā diǎn. Wǒ zài gōngsī gōngzuò bā gè xiǎoshí.', 'A las ocho. Trabajo ocho horas en la empresa.'),
      L('小王', '你累吗？', 'Nǐ lèi ma?', '¿Estás cansado?'),
      L('bao', '很累！晚上我休息。', 'Hěn lèi! Wǎnshang wǒ xiūxi.', '¡Mucho! Por la noche descanso.'),
      L('bao', '现在我正在准备睡觉！', 'Xiànzài wǒ zhèngzài zhǔnbèi shuìjiào!', '¡Ahora mismo me estoy preparando para dormir!'),
    ],
    questions: [
      { after: 1, question: '¿A qué hora se levanta Bao?', options: ['A las 7', 'A las 8', 'A las 10'], answer: 0 },
      { after: 3, question: '¿Cuántas horas trabaja Bao?', options: ['7', '8', '10'], answer: 1 },
    ],
  },
  {
    id: 's12', unitId: 'u12', icon: '🍉', title: 'En el mercado', partner: { name: '服务员', icon: '👵' },
    lines: [
      L('bao', '你好！西瓜怎么卖？', 'Nǐ hǎo! Xīguā zěnme mài?', '¡Hola! ¿A cuánto está la sandía?'),
      L('服务员', '一公斤五块钱。', 'Yì gōngjīn wǔ kuài qián.', 'A cinco yuanes el kilo.'),
      L('bao', '我要两公斤。还有鸡蛋吗？', 'Wǒ yào liǎng gōngjīn. Hái yǒu jīdàn ma?', 'Quiero dos kilos. ¿Tiene huevos también?'),
      L('服务员', '有！十个鸡蛋八块。', 'Yǒu! Shí gè jīdàn bā kuài.', '¡Sí! Diez huevos, ocho yuanes.'),
      L('bao', '好，我给你二十块。', 'Hǎo, wǒ gěi nǐ èrshí kuài.', 'Vale, le doy veinte yuanes.'),
      L('服务员', '找你两块。谢谢！', 'Zhǎo nǐ liǎng kuài. Xièxie!', 'Le devuelvo dos yuanes. ¡Gracias!'),
    ],
    questions: [
      { after: 1, question: '¿Cuánto cuesta el kilo de sandía?', options: ['5 yuanes', '8 yuanes', '10 yuanes'], answer: 0 },
      { after: 5, question: '¿Cuánto le devuelven de cambio?', options: ['8 yuanes', '2 yuanes', '20 yuanes'], answer: 1 },
    ],
  },
  {
    id: 's13', unitId: 'u13', icon: '🧭', title: '¿Cómo voy al aeropuerto?', partner: { name: '先生', icon: '👮' },
    lines: [
      L('bao', '对不起，机场离这里远吗？', 'Duìbuqǐ, jīchǎng lí zhèlǐ yuǎn ma?', 'Perdone, ¿el aeropuerto está lejos de aquí?'),
      L('先生', '很远。你可以坐公共汽车。', 'Hěn yuǎn. Nǐ kěyǐ zuò gōnggòng qìchē.', 'Muy lejos. Puedes ir en autobús.'),
      L('bao', '在哪里坐公共汽车？', 'Zài nǎlǐ zuò gōnggòng qìchē?', '¿Dónde se coge el autobús?'),
      L('先生', '在商店的左边。', 'Zài shāngdiàn de zuǒbiān.', 'A la izquierda de la tienda.'),
      L('bao', '从这里到机场要几个小时？', 'Cóng zhèlǐ dào jīchǎng yào jǐ gè xiǎoshí?', '¿Cuántas horas se tarda de aquí al aeropuerto?'),
      L('先生', '一个小时。', 'Yí gè xiǎoshí.', 'Una hora.'),
      L('bao', '谢谢您！', 'Xièxie nín!', '¡Muchas gracias!'),
    ],
    questions: [
      { after: 1, question: '¿Está cerca el aeropuerto?', options: ['Sí, muy cerca', 'No, está lejos', 'Está al lado'], answer: 1 },
      { after: 3, question: '¿Dónde se coge el autobús?', options: ['A la izquierda de la tienda', 'Delante del hospital', 'En la escuela'], answer: 0 },
    ],
  },
  {
    id: 's14', unitId: 'u14', icon: '💊', title: 'Bao va al médico', partner: { name: '医生', icon: '🩺' },
    lines: [
      L('医生', '你好，你怎么了？', 'Nǐ hǎo, nǐ zěnme le?', 'Hola, ¿qué te pasa?'),
      L('bao', '医生，我生病了，很累。', 'Yīshēng, wǒ shēngbìng le, hěn lèi.', 'Doctor, estoy enfermo y muy cansado.'),
      L('医生', '你每天运动吗？', 'Nǐ měi tiān yùndòng ma?', '¿Haces deporte cada día?'),
      L('bao', '不运动。我喜欢睡觉。', 'Bú yùndòng. Wǒ xǐhuan shuìjiào.', 'No. Me gusta dormir.'),
      L('医生', '吃药，多喝水，休息两天。', 'Chī yào, duō hē shuǐ, xiūxi liǎng tiān.', 'Toma la medicina, bebe mucha agua y descansa dos días.'),
      L('医生', '身体好了，我们一起去跑步吧！', 'Shēntǐ hǎo le, wǒmen yìqǐ qù pǎobù ba!', 'Cuando estés bien, ¡vamos a correr juntos!'),
      L('bao', '好！我也想去游泳。', 'Hǎo! Wǒ yě xiǎng qù yóuyǒng.', '¡Vale! También quiero ir a nadar.'),
    ],
    questions: [
      { after: 1, question: '¿Qué le pasa a Bao?', options: ['Le duele una pierna', 'Está enfermo y cansado', 'Nada'], answer: 1 },
      { after: 4, question: '¿Qué le dice el médico?', options: ['Medicina, agua y descanso', 'Correr mucho', 'Comer más'], answer: 0 },
    ],
  },
  {
    id: 's15', unitId: 'u15', icon: '📝', title: 'Una pregunta en clase', partner: { name: '老师', icon: '👩' },
    lines: [
      L('老师', '大家好！今天有考试。', 'Dàjiā hǎo! Jīntiān yǒu kǎoshì.', '¡Hola a todos! Hoy hay examen.'),
      L('bao', '老师，我有一个问题。', 'Lǎoshī, wǒ yǒu yí gè wèntí.', 'Profesora, tengo una pregunta.'),
      L('老师', '请说。', 'Qǐng shuō.', 'Dime.'),
      L('bao', '这个字是什么意思？', 'Zhège zì shì shénme yìsi?', '¿Qué significa este carácter?'),
      L('老师', '是“快乐”的“乐”。你懂了吗？', 'Shì "kuàilè" de "lè". Nǐ dǒng le ma?', 'Es el «lè» de «kuàilè» (feliz). ¿Lo entiendes?'),
      L('bao', '懂了！我觉得考试不难。', 'Dǒng le! Wǒ juéde kǎoshì bù nán.', '¡Entendido! Creo que el examen no es difícil.'),
      L('老师', '很好！我们开始吧！', 'Hěn hǎo! Wǒmen kāishǐ ba!', '¡Muy bien! ¡Empecemos!'),
    ],
    questions: [
      { after: 0, question: '¿Qué hay hoy en clase?', options: ['Una fiesta', 'Un examen', 'Nada'], answer: 1 },
      { after: 5, question: '¿Qué piensa Bao del examen?', options: ['Que no es difícil', 'Que es muy difícil', 'No lo sabe'], answer: 0 },
    ],
  },
  {
    id: 's16', unitId: 'u16', icon: '🇨🇳', title: '¿Por qué estudias chino?', partner: { name: '小王', icon: '🧑' },
    lines: [
      L('小王', '宝宝，你为什么学习汉语？', 'Bǎobao, nǐ wèi shénme xuéxí Hànyǔ?', 'Baobao, ¿por qué estudias chino?'),
      L('bao', '因为我想去中国旅游。', 'Yīnwèi wǒ xiǎng qù Zhōngguó lǚyóu.', 'Porque quiero viajar a China.'),
      L('小王', '汉语难吗？', 'Hànyǔ nán ma?', '¿Es difícil el chino?'),
      L('bao', '很难，但是很有意思！', 'Hěn nán, dànshì hěn yǒu yìsi!', 'Es difícil, ¡pero muy interesante!'),
      L('小王', '你的汉语比我的好！', 'Nǐ de Hànyǔ bǐ wǒ de hǎo!', '¡Tu chino es mejor que el mío!'),
      L('bao', '哪里哪里！你说得也很好。', 'Nǎlǐ nǎlǐ! Nǐ shuō de yě hěn hǎo.', '¡Qué va! Tú también hablas muy bien.'),
      L('小王', '我们明天再一起练习吧！', 'Wǒmen míngtiān zài yìqǐ liànxí ba!', '¡Mañana practicamos juntos otra vez!'),
    ],
    questions: [
      { after: 1, question: '¿Por qué estudia chino Bao?', options: ['Por el trabajo', 'Quiere viajar a China', 'Por un examen'], answer: 1 },
      { after: 5, question: '¿Por qué Bao responde «哪里哪里»?', options: ['Por modestia, ante un elogio', 'Porque no sabe dónde está', 'Porque está enfadado'], answer: 0 },
    ],
  },
];

/** Dos historias más por unidad (b y c), con el mismo vocabulario. */
const EXTRA: Story[] = [
  // ---- Unidad 1 · Saludos
  {
    id: 's1b', unitId: 'u1', icon: '🙋', title: 'La nueva compañera', partner: { name: '小红', icon: '👧' },
    lines: [
      L('bao', '你好！我是宝宝。', 'Nǐ hǎo! Wǒ shì Bǎobao.', '¡Hola! Soy Baobao.'),
      L('小红', '你好！我叫小红。', 'Nǐ hǎo! Wǒ jiào Xiǎo Hóng.', '¡Hola! Me llamo Xiaohong.'),
      L('bao', '认识你很高兴！他叫什么名字？', 'Rènshi nǐ hěn gāoxìng! Tā jiào shénme míngzi?', '¡Encantado! ¿Cómo se llama él?'),
      L('小红', '他叫王先生。', 'Tā jiào Wáng xiānsheng.', 'Se llama señor Wang.'),
      L('bao', '王先生，你好！', 'Wáng xiānsheng, nǐ hǎo!', '¡Hola, señor Wang!'),
      L('王先生', '你好！请坐。', 'Nǐ hǎo! Qǐng zuò.', '¡Hola! Siéntate, por favor.'),
      L('bao', '谢谢！', 'Xièxie!', '¡Gracias!'),
    ],
    questions: [
      { after: 1, question: '¿Cómo se llama la chica?', options: ['Xiaohong', 'Baobao', 'Wang'], answer: 0 },
      { after: 3, question: '¿Cómo se llama él?', options: ['Xiao Wang', 'Señor Wang', 'Bao'], answer: 1 },
    ],
  },
  {
    id: 's1c', unitId: 'u1', icon: '🙇', title: '¡Perdón!', partner: { name: '小红', icon: '👧' },
    lines: [
      L('bao', '对不起！', 'Duìbuqǐ!', '¡Perdón!'),
      L('小红', '没关系。', 'Méi guānxi.', 'No pasa nada.'),
      L('bao', '你是王小姐吗？', 'Nǐ shì Wáng xiǎojiě ma?', '¿Es usted la señorita Wang?'),
      L('小红', '不是，我叫小红。', 'Bú shì, wǒ jiào Xiǎo Hóng.', 'No, me llamo Xiaohong.'),
      L('bao', '你好，小红！认识你很高兴。', 'Nǐ hǎo, Xiǎo Hóng! Rènshi nǐ hěn gāoxìng.', '¡Hola, Xiaohong! Encantado de conocerte.'),
      L('小红', '我也很高兴。再见！', 'Wǒ yě hěn gāoxìng. Zàijiàn!', 'Yo también. ¡Adiós!'),
      L('bao', '再见！', 'Zàijiàn!', '¡Adiós!'),
    ],
    questions: [
      { after: 1, question: '¿Qué responde ella al «对不起»?', options: ['De nada', 'No pasa nada', 'Adiós'], answer: 1 },
      { after: 3, question: '¿Es la señorita Wang?', options: ['Sí', 'No, es Xiaohong', 'No lo dice'], answer: 1 },
    ],
  },
  // ---- Unidad 2 · Números
  {
    id: 's2b', unitId: 'u2', icon: '🍎', title: 'Cinco manzanas', partner: { name: '服务员', icon: '🙋' },
    lines: [
      L('bao', '你好！苹果多少钱？', 'Nǐ hǎo! Píngguǒ duōshao qián?', '¡Hola! ¿Cuánto cuestan las manzanas?'),
      L('服务员', '一个三块钱。', 'Yí gè sān kuài qián.', 'Tres yuanes cada una.'),
      L('bao', '我要五个。', 'Wǒ yào wǔ gè.', 'Quiero cinco.'),
      L('服务员', '五个，十五块。', 'Wǔ gè, shíwǔ kuài.', 'Cinco, quince yuanes.'),
      L('bao', '好，谢谢！', 'Hǎo, xièxie!', '¡Vale, gracias!'),
      L('服务员', '不客气！', 'Bú kèqi!', '¡De nada!'),
    ],
    questions: [
      { after: 1, question: '¿Cuánto cuesta una manzana?', options: ['5 yuanes', '3 yuanes', '15 yuanes'], answer: 1 },
      { after: 3, question: '¿Cuánto paga Bao en total?', options: ['15 yuanes', '5 yuanes', '3 yuanes'], answer: 0 },
    ],
  },
  {
    id: 's2c', unitId: 'u2', icon: '🎂', title: '¿Cuántos años tiene tu madre?', partner: { name: '小王', icon: '🧑' },
    lines: [
      L('小王', '宝宝，你妈妈多大？', 'Bǎobao, nǐ māma duō dà?', 'Baobao, ¿cuántos años tiene tu madre?'),
      L('bao', '她三十八岁。', 'Tā sānshíbā suì.', 'Tiene treinta y ocho años.'),
      L('小王', '你爸爸呢？', 'Nǐ bàba ne?', '¿Y tu padre?'),
      L('bao', '他四十岁。', 'Tā sìshí suì.', 'Tiene cuarenta.'),
      L('小王', '你家有几个人？', 'Nǐ jiā yǒu jǐ gè rén?', '¿Cuántos sois en tu familia?'),
      L('bao', '三个：爸爸、妈妈和我。', 'Sān gè: bàba, māma hé wǒ.', 'Tres: papá, mamá y yo.'),
    ],
    questions: [
      { after: 1, question: '¿Cuántos años tiene la madre de Bao?', options: ['30', '38', '40'], answer: 1 },
      { after: 3, question: '¿Y el padre?', options: ['40', '38', '14'], answer: 0 },
    ],
  },
  // ---- Unidad 3 · Familia
  {
    id: 's3b', unitId: 'u3', icon: '🖼️', title: 'Una foto de familia', partner: { name: '同学', icon: '🧒' },
    lines: [
      L('同学', '宝宝，这是你的家人吗？', 'Bǎobao, zhè shì nǐ de jiārén ma?', 'Baobao, ¿esta es tu familia?'),
      L('bao', '是。这是我爸爸，他是老师。', 'Shì. Zhè shì wǒ bàba, tā shì lǎoshī.', 'Sí. Este es mi padre, es profesor.'),
      L('同学', '那是谁？', 'Nà shì shéi?', '¿Y esa quién es?'),
      L('bao', '那是我妈妈的朋友。她是医生。', 'Nà shì wǒ māma de péngyou. Tā shì yīshēng.', 'Es una amiga de mi madre. Es médica.'),
      L('同学', '你爸爸是我的老师！', 'Nǐ bàba shì wǒ de lǎoshī!', '¡Tu padre es mi profesor!'),
      L('bao', '是吗？', 'Shì ma?', '¿Ah, sí?'),
    ],
    questions: [
      { after: 1, question: '¿En qué trabaja el padre de Bao?', options: ['Médico', 'Profesor', 'Estudiante'], answer: 1 },
      { after: 3, question: '¿Quién es la médica?', options: ['La amiga de su madre', 'Su madre', 'Su profesora'], answer: 0 },
    ],
  },
  {
    id: 's3c', unitId: 'u3', icon: '👦', title: '¿Quién es ese chico?', partner: { name: '小王', icon: '🧑' },
    lines: [
      L('bao', '小王，他是谁？', 'Xiǎo Wáng, tā shì shéi?', 'Xiao Wang, ¿quién es él?'),
      L('小王', '他是我的同学。', 'Tā shì wǒ de tóngxué.', 'Es mi compañero de clase.'),
      L('bao', '他是学生吗？', 'Tā shì xuésheng ma?', '¿Es estudiante?'),
      L('小王', '是。他爸爸是医生，妈妈是老师。', 'Shì. Tā bàba shì yīshēng, māma shì lǎoshī.', 'Sí. Su padre es médico y su madre, profesora.'),
      L('bao', '你呢？你爸爸是医生吗？', 'Nǐ ne? Nǐ bàba shì yīshēng ma?', '¿Y tú? ¿Tu padre es médico?'),
      L('小王', '不是，他是老师。', 'Bú shì, tā shì lǎoshī.', 'No, es profesor.'),
    ],
    questions: [
      { after: 1, question: '¿Quién es el chico?', options: ['Su hermano', 'Su compañero de clase', 'Su profesor'], answer: 1 },
      { after: 3, question: '¿Qué es la madre del chico?', options: ['Profesora', 'Médica', 'Estudiante'], answer: 0 },
    ],
  },
  // ---- Unidad 4 · Comida
  {
    id: 's4b', unitId: 'u4', icon: '🍇', title: '¿Qué te gusta comer?', partner: { name: '小王', icon: '🧑' },
    lines: [
      L('小王', '宝宝，你喜欢吃什么？', 'Bǎobao, nǐ xǐhuan chī shénme?', 'Baobao, ¿qué te gusta comer?'),
      L('bao', '我喜欢吃水果。', 'Wǒ xǐhuan chī shuǐguǒ.', 'Me gusta la fruta.'),
      L('小王', '我喜欢吃米饭和菜。', 'Wǒ xǐhuan chī mǐfàn hé cài.', 'A mí me gustan el arroz y la verdura.'),
      L('bao', '你想喝茶吗？', 'Nǐ xiǎng hē chá ma?', '¿Quieres un té?'),
      L('小王', '我不想喝茶，我想喝水。', 'Wǒ bù xiǎng hē chá, wǒ xiǎng hē shuǐ.', 'No quiero té, quiero agua.'),
      L('bao', '好，我们去饭馆吧！', 'Hǎo, wǒmen qù fànguǎn ba!', '¡Vale, vamos a un restaurante!'),
    ],
    questions: [
      { after: 1, question: '¿Qué le gusta comer a Bao?', options: ['Fruta', 'Arroz', 'Verdura'], answer: 0 },
      { after: 4, question: '¿Qué quiere beber Xiao Wang?', options: ['Té', 'Agua', 'Nada'], answer: 1 },
    ],
  },
  {
    id: 's4c', unitId: 'u4', icon: '🛒', title: 'Comprando fruta', partner: { name: '服务员', icon: '👵' },
    lines: [
      L('bao', '你好，我想买水果。', 'Nǐ hǎo, wǒ xiǎng mǎi shuǐguǒ.', 'Hola, quiero comprar fruta.'),
      L('服务员', '苹果很好吃，一块钱一个。', 'Píngguǒ hěn hǎochī, yí kuài qián yí gè.', 'Las manzanas están muy ricas, a un yuan cada una.'),
      L('bao', '我要十个。', 'Wǒ yào shí gè.', 'Quiero diez.'),
      L('服务员', '十个十块钱。还要什么？', 'Shí gè shí kuài qián. Hái yào shénme?', 'Diez, diez yuanes. ¿Algo más?'),
      L('bao', '不要了，谢谢！', 'Bú yào le, xièxie!', 'Nada más, ¡gracias!'),
      L('服务员', '不客气！', 'Bú kèqi!', '¡De nada!'),
    ],
    questions: [
      { after: 0, question: '¿Qué quiere comprar Bao?', options: ['Té', 'Fruta', 'Arroz'], answer: 1 },
      { after: 3, question: '¿Cuánto paga Bao?', options: ['10 yuanes', '1 yuan', '100 yuanes'], answer: 0 },
    ],
  },
  // ---- Unidad 5 · El tiempo
  {
    id: 's5b', unitId: 'u5', icon: '📅', title: 'El fin de semana', partner: { name: '小王', icon: '🧑' },
    lines: [
      L('小王', '今天星期几？', 'Jīntiān xīngqī jǐ?', '¿Qué día es hoy?'),
      L('bao', '今天星期五。', 'Jīntiān xīngqīwǔ.', 'Hoy es viernes.'),
      L('小王', '明天你想做什么？', 'Míngtiān nǐ xiǎng zuò shénme?', '¿Qué quieres hacer mañana?'),
      L('bao', '明天上午我想去商店，下午睡觉。', 'Míngtiān shàngwǔ wǒ xiǎng qù shāngdiàn, xiàwǔ shuìjiào.', 'Mañana por la mañana quiero ir a la tienda y por la tarde, dormir.'),
      L('小王', '明天下雨，太冷了！', 'Míngtiān xià yǔ, tài lěng le!', '¡Mañana llueve y hace demasiado frío!'),
      L('bao', '那我在家睡觉！', 'Nà wǒ zài jiā shuìjiào!', '¡Entonces me quedo durmiendo en casa!'),
    ],
    questions: [
      { after: 1, question: '¿Qué día es hoy?', options: ['Lunes', 'Viernes', 'Domingo'], answer: 1 },
      { after: 4, question: '¿Qué tiempo hará mañana?', options: ['Lluvia y frío', 'Calor', 'Sol'], answer: 0 },
    ],
  },
  {
    id: 's5c', unitId: 'u5', icon: '⏰', title: '¿Qué hora es?', partner: { name: '老师', icon: '👩' },
    lines: [
      L('老师', '宝宝，现在几点？', 'Bǎobao, xiànzài jǐ diǎn?', 'Baobao, ¿qué hora es?'),
      L('bao', '现在十点。', 'Xiànzài shí diǎn.', 'Son las diez.'),
      L('老师', '我们中午吃饭，还有两个小时。', 'Wǒmen zhōngwǔ chī fàn, hái yǒu liǎng gè xiǎoshí.', 'Comemos a mediodía; aún quedan dos horas.'),
      L('bao', '太好了！', 'Tài hǎo le!', '¡Genial!'),
      L('老师', '昨天你几点睡觉？', 'Zuótiān nǐ jǐ diǎn shuìjiào?', '¿A qué hora te acostaste ayer?'),
      L('bao', '十二点。', "Shí'èr diǎn.", 'A las doce.'),
      L('老师', '你要多睡觉！', 'Nǐ yào duō shuìjiào!', '¡Tienes que dormir más!'),
    ],
    questions: [
      { after: 1, question: '¿Qué hora es?', options: ['Las 12', 'Las 10', 'Mediodía'], answer: 1 },
      { after: 5, question: '¿A qué hora se acostó Bao ayer?', options: ['A las 12', 'A las 10', 'A mediodía'], answer: 0 },
    ],
  },
  // ---- Unidad 6 · La ciudad
  {
    id: 's6b', unitId: 'u6', icon: '🏫', title: '¿Dónde está la escuela?', partner: { name: '先生', icon: '🧔' },
    lines: [
      L('bao', '先生，请问，学校在哪里？', 'Xiānsheng, qǐngwèn, xuéxiào zài nǎlǐ?', 'Señor, perdone, ¿dónde está la escuela?'),
      L('先生', '学校在医院后面。', 'Xuéxiào zài yīyuàn hòumiàn.', 'La escuela está detrás del hospital.'),
      L('bao', '医院在哪里？', 'Yīyuàn zài nǎlǐ?', '¿Y dónde está el hospital?'),
      L('先生', '医院在商店前面。你坐出租车去吧。', 'Yīyuàn zài shāngdiàn qiánmiàn. Nǐ zuò chūzūchē qù ba.', 'Delante de la tienda. Ve en taxi.'),
      L('bao', '谢谢！', 'Xièxie!', '¡Gracias!'),
    ],
    questions: [
      { after: 1, question: '¿Dónde está la escuela?', options: ['Delante de la tienda', 'Detrás del hospital', 'En el aeropuerto'], answer: 1 },
      { after: 3, question: '¿Cómo le dice que vaya?', options: ['En taxi', 'En avión', 'Andando'], answer: 0 },
    ],
  },
  {
    id: 's6c', unitId: 'u6', icon: '🏠', title: 'Vuelta a casa', partner: { name: '妈妈', icon: '👩' },
    lines: [
      L('妈妈', '宝宝，你在哪里？', 'Bǎobao, nǐ zài nǎlǐ?', 'Baobao, ¿dónde estás?'),
      L('bao', '我在火车站。', 'Wǒ zài huǒchēzhàn.', 'Estoy en la estación de tren.'),
      L('妈妈', '你什么时候回来？', 'Nǐ shénme shíhou huílai?', '¿Cuándo vuelves?'),
      L('bao', '我坐出租车回家，下午三点到。', 'Wǒ zuò chūzūchē huí jiā, xiàwǔ sān diǎn dào.', 'Vuelvo a casa en taxi; llego a las tres de la tarde.'),
      L('妈妈', '好，我在家里。', 'Hǎo, wǒ zài jiā lǐ.', 'Vale, estoy en casa.'),
    ],
    questions: [
      { after: 1, question: '¿Dónde está Bao?', options: ['En el aeropuerto', 'En la estación de tren', 'En la escuela'], answer: 1 },
      { after: 3, question: '¿A qué hora llega a casa?', options: ['A las 3 de la tarde', 'A las 3 de la mañana', 'A mediodía'], answer: 0 },
    ],
  },
  // ---- Unidad 7 · Mi día
  {
    id: 's7b', unitId: 'u7', icon: '📞', title: 'Una llamada de mamá', partner: { name: '妈妈', icon: '👩' },
    lines: [
      L('妈妈', '喂，宝宝！你在做什么？', 'Wéi, Bǎobao! Nǐ zài zuò shénme?', '¿Diga? ¡Baobao! ¿Qué estás haciendo?'),
      L('bao', '我在看书。', 'Wǒ zài kàn shū.', 'Estoy leyendo.'),
      L('妈妈', '你在学习汉语吗？', 'Nǐ zài xuéxí Hànyǔ ma?', '¿Estás estudiando chino?'),
      L('bao', '是！我会写二十个字了。', 'Shì! Wǒ huì xiě èrshí gè zì le.', '¡Sí! Ya sé escribir veinte caracteres.'),
      L('妈妈', '晚上你能给我打电话吗？', 'Wǎnshang nǐ néng gěi wǒ dǎ diànhuà ma?', '¿Me puedes llamar por la noche?'),
      L('bao', '能！再见，妈妈！', 'Néng! Zàijiàn, māma!', '¡Sí! ¡Adiós, mamá!'),
    ],
    questions: [
      { after: 1, question: '¿Qué está haciendo Bao?', options: ['Ver la tele', 'Leer', 'Dormir'], answer: 1 },
      { after: 3, question: '¿Cuántos caracteres sabe escribir?', options: ['20', '10', '2'], answer: 0 },
    ],
  },
  {
    id: 's7c', unitId: 'u7', icon: '🎬', title: 'Vamos al cine', partner: { name: '小王', icon: '🧑' },
    lines: [
      L('小王', '你看那个电影了吗？', 'Nǐ kàn nàge diànyǐng le ma?', '¿Viste esa película?'),
      L('bao', '没看。我昨天在工作。', 'Méi kàn. Wǒ zuótiān zài gōngzuò.', 'No. Ayer estaba trabajando.'),
      L('小王', '今天下午我们一起去看吧！', 'Jīntiān xiàwǔ wǒmen yìqǐ qù kàn ba!', '¡Vamos a verla juntos esta tarde!'),
      L('bao', '好！几点开始？', 'Hǎo! Jǐ diǎn kāishǐ?', '¡Vale! ¿A qué hora empieza?'),
      L('小王', '三点。', 'Sān diǎn.', 'A las tres.'),
      L('bao', '我能和我的同学一起去吗？', 'Wǒ néng hé wǒ de tóngxué yìqǐ qù ma?', '¿Puedo ir con mi compañero de clase?'),
      L('小王', '能，我们三个人一起去！', 'Néng, wǒmen sān gè rén yìqǐ qù!', '¡Claro, vamos los tres!'),
    ],
    questions: [
      { after: 1, question: '¿Por qué no vio Bao la película?', options: ['Estaba enfermo', 'Ayer trabajaba', 'Estaba durmiendo'], answer: 1 },
      { after: 4, question: '¿A qué hora empieza?', options: ['A las 3', 'A las 2', 'A las 4'], answer: 0 },
    ],
  },
  // ---- Unidad 8 · Mi mundo
  {
    id: 's8b', unitId: 'u8', icon: '🐶', title: 'El perro y el gato', partner: { name: '小王', icon: '🧑' },
    lines: [
      L('bao', '小王，你的狗在哪里？', 'Xiǎo Wáng, nǐ de gǒu zài nǎlǐ?', 'Xiao Wang, ¿dónde está tu perro?'),
      L('小王', '它在桌子下。', 'Tā zài zhuōzi xià.', 'Está debajo de la mesa.'),
      L('bao', '你的狗很大！', 'Nǐ de gǒu hěn dà!', '¡Tu perro es muy grande!'),
      L('小王', '是，我的猫很小。', 'Shì, wǒ de māo hěn xiǎo.', 'Sí, y mi gato es muy pequeño.'),
      L('bao', '猫和狗都很漂亮！', 'Māo hé gǒu dōu hěn piàoliang!', '¡El gato y el perro son muy bonitos!'),
      L('小王', '谢谢！', 'Xièxie!', '¡Gracias!'),
    ],
    questions: [
      { after: 1, question: '¿Dónde está el perro?', options: ['En la silla', 'Debajo de la mesa', 'En la cama'], answer: 1 },
      { after: 3, question: '¿Cómo es el gato?', options: ['Pequeño', 'Grande', 'Negro'], answer: 0 },
    ],
  },
  {
    id: 's8c', unitId: 'u8', icon: '🎁', title: 'Las compras de mamá', partner: { name: '妈妈', icon: '👩' },
    lines: [
      L('妈妈', '宝宝，这些衣服怎么样？', 'Bǎobao, zhèxiē yīfu zěnmeyàng?', 'Baobao, ¿qué te parece esta ropa?'),
      L('bao', '很漂亮！', 'Hěn piàoliang!', '¡Muy bonita!'),
      L('妈妈', '我买了一些衣服和一本书。', 'Wǒ mǎi le yìxiē yīfu hé yì běn shū.', 'He comprado algo de ropa y un libro.'),
      L('bao', '书是给我的吗？', 'Shū shì gěi wǒ de ma?', '¿El libro es para mí?'),
      L('妈妈', '是。你喜欢吗？', 'Shì. Nǐ xǐhuan ma?', 'Sí. ¿Te gusta?'),
      L('bao', '很喜欢！谢谢妈妈！', 'Hěn xǐhuan! Xièxie māma!', '¡Me encanta! ¡Gracias, mamá!'),
    ],
    questions: [
      { after: 2, question: '¿Qué ha comprado mamá?', options: ['Ropa y un libro', 'Una silla', 'Comida'], answer: 0 },
      { after: 4, question: '¿Para quién es el libro?', options: ['Para mamá', 'Para Bao', 'Para Xiao Wang'], answer: 1 },
    ],
  },
  // ---- Unidad 9 · Describir
  {
    id: 's9b', unitId: 'u9', icon: '🐱', title: 'El gato nuevo', partner: { name: '小王', icon: '🧑' },
    lines: [
      L('小王', '你看，这是我的新猫！', 'Nǐ kàn, zhè shì wǒ de xīn māo!', '¡Mira, mi gato nuevo!'),
      L('bao', '它是白的，真漂亮！', 'Tā shì bái de, zhēn piàoliang!', 'Es blanco, ¡qué bonito!'),
      L('小王', '我也喜欢黑猫。', 'Wǒ yě xǐhuan hēi māo.', 'También me gustan los gatos negros.'),
      L('bao', '白猫和黑猫，哪个好？', 'Bái māo hé hēi māo, nǎge hǎo?', 'Gato blanco o gato negro, ¿cuál es mejor?'),
      L('小王', '都好！', 'Dōu hǎo!', '¡Los dos!'),
    ],
    questions: [
      { after: 1, question: '¿De qué color es el gato nuevo?', options: ['Negro', 'Blanco', 'Rojo'], answer: 1 },
      { after: 4, question: '¿Cuál prefiere Xiao Wang?', options: ['Le gustan los dos', 'El negro', 'El blanco'], answer: 0 },
    ],
  },
  {
    id: 's9c', unitId: 'u9', icon: '👗', title: 'En la tienda de ropa', partner: { name: '服务员', icon: '🙋' },
    lines: [
      L('bao', '这个红的多少钱？', 'Zhège hóng de duōshao qián?', '¿Cuánto cuesta este rojo?'),
      L('服务员', '三百块。', 'Sānbǎi kuài.', 'Trescientos yuanes.'),
      L('bao', '太贵了！有便宜的吗？', 'Tài guì le! Yǒu piányi de ma?', '¡Es muy caro! ¿Tiene algo más barato?'),
      L('服务员', '这个白的很便宜，一百块。', 'Zhège bái de hěn piányi, yìbǎi kuài.', 'Este blanco es barato: cien yuanes.'),
      L('bao', '白的也很漂亮。我买白的！', 'Bái de yě hěn piàoliang. Wǒ mǎi bái de!', 'El blanco también es bonito. ¡Me llevo el blanco!'),
    ],
    questions: [
      { after: 1, question: '¿Cuánto cuesta el rojo?', options: ['100 yuanes', '300 yuanes', '30 yuanes'], answer: 1 },
      { after: 4, question: '¿Cuál compra Bao?', options: ['El blanco', 'El rojo', 'Ninguno'], answer: 0 },
    ],
  },
  // ---- Unidad 10 · Personas
  {
    id: 's10b', unitId: 'u10', icon: '👋', title: 'Bienvenido a clase', partner: { name: '老师', icon: '👩' },
    lines: [
      L('老师', '大家好！欢迎新同学！', 'Dàjiā hǎo! Huānyíng xīn tóngxué!', '¡Hola a todos! ¡Bienvenido, compañero nuevo!'),
      L('老师', '请介绍一下。', 'Qǐng jièshào yíxià.', 'Preséntate, por favor.'),
      L('bao', '大家好！我叫宝宝。我有一个姐姐和一个妹妹。', 'Dàjiā hǎo! Wǒ jiào Bǎobao. Wǒ yǒu yí gè jiějie hé yí gè mèimei.', '¡Hola a todos! Me llamo Baobao. Tengo una hermana mayor y una hermana pequeña.'),
      L('老师', '你姐姐几岁？', 'Nǐ jiějie jǐ suì?', '¿Cuántos años tiene tu hermana mayor?'),
      L('bao', '她十岁，妹妹三岁。', 'Tā shí suì, mèimei sān suì.', 'Tiene diez años, y mi hermana pequeña, tres.'),
      L('老师', '欢迎你，宝宝！', 'Huānyíng nǐ, Bǎobao!', '¡Bienvenido, Baobao!'),
    ],
    questions: [
      { after: 2, question: '¿Cuántas hermanas tiene Bao?', options: ['Una', 'Dos: una mayor y una pequeña', 'Ninguna'], answer: 1 },
      { after: 4, question: '¿Cuántos años tiene su hermana pequeña?', options: ['3', '10', '5'], answer: 0 },
    ],
  },
  {
    id: 's10c', unitId: 'u10', icon: '🏡', title: 'El vecino nuevo', partner: { name: '先生', icon: '🧔' },
    lines: [
      L('bao', '您好！您贵姓？', 'Nín hǎo! Nín guì xìng?', '¡Buenos días! ¿Cuál es su apellido?'),
      L('先生', '我姓王。这是我的妻子。', 'Wǒ xìng Wáng. Zhè shì wǒ de qīzi.', 'Me apellido Wang. Esta es mi esposa.'),
      L('bao', '您有孩子吗？', 'Nín yǒu háizi ma?', '¿Tiene hijos?'),
      L('先生', '有两个孩子，一个儿子，一个女儿。', "Yǒu liǎng gè háizi, yí gè érzi, yí gè nǚ'ér.", 'Tengo dos: un hijo y una hija.'),
      L('bao', '认识您很高兴！', 'Rènshi nín hěn gāoxìng!', '¡Encantado de conocerle!'),
    ],
    questions: [
      { after: 1, question: '¿Cómo se apellida el señor?', options: ['Bao', 'Wang', 'Li'], answer: 1 },
      { after: 3, question: '¿Cuántos hijos tiene?', options: ['Dos: un hijo y una hija', 'Uno', 'Tres'], answer: 0 },
    ],
  },
  // ---- Unidad 11 · Rutina
  {
    id: 's11b', unitId: 'u11', icon: '☕', title: 'Un día tranquilo', partner: { name: '小王', icon: '🧑' },
    lines: [
      L('小王', '宝宝，你今天忙吗？', 'Bǎobao, nǐ jīntiān máng ma?', 'Baobao, ¿estás ocupado hoy?'),
      L('bao', '不忙，今天我不上班。', 'Bù máng, jīntiān wǒ bú shàngbān.', 'No, hoy no trabajo.'),
      L('小王', '你早上几点起床？', 'Nǐ zǎoshang jǐ diǎn qǐchuáng?', '¿A qué hora te has levantado?'),
      L('bao', '九点。我已经洗了衣服。', 'Jiǔ diǎn. Wǒ yǐjīng xǐ le yīfu.', 'A las nueve. Ya he lavado la ropa.'),
      L('小王', '下午你有时间吗？', 'Xiàwǔ nǐ yǒu shíjiān ma?', '¿Tienes tiempo por la tarde?'),
      L('bao', '有！我们去喝茶吧。', 'Yǒu! Wǒmen qù hē chá ba.', '¡Sí! Vamos a tomar un té.'),
    ],
    questions: [
      { after: 1, question: '¿Está ocupado Bao hoy?', options: ['No, hoy no trabaja', 'Sí, mucho', 'Está enfermo'], answer: 0 },
      { after: 3, question: '¿Qué ha hecho ya Bao?', options: ['Trabajar', 'Lavar la ropa', 'Estudiar'], answer: 1 },
    ],
  },
  {
    id: 's11c', unitId: 'u11', icon: '😴', title: 'Demasiado trabajo', partner: { name: '妈妈', icon: '👩' },
    lines: [
      L('妈妈', '宝宝，你很累吗？', 'Bǎobao, nǐ hěn lèi ma?', 'Baobao, ¿estás muy cansado?'),
      L('bao', '很累。我每天工作十个小时。', 'Hěn lèi. Wǒ měi tiān gōngzuò shí gè xiǎoshí.', 'Mucho. Trabajo diez horas al día.'),
      L('妈妈', '太多了！你要休息。', 'Tài duō le! Nǐ yào xiūxi.', '¡Es demasiado! Tienes que descansar.'),
      L('bao', '我正在准备一个考试。', 'Wǒ zhèngzài zhǔnbèi yí gè kǎoshì.', 'Estoy preparando un examen.'),
      L('妈妈', '考试完了，我们一起去旅游吧！', 'Kǎoshì wán le, wǒmen yìqǐ qù lǚyóu ba!', '¡Cuando acabe el examen, nos vamos de viaje juntos!'),
      L('bao', '好！', 'Hǎo!', '¡Vale!'),
    ],
    questions: [
      { after: 1, question: '¿Cuántas horas trabaja Bao al día?', options: ['8', '10', '12'], answer: 1 },
      { after: 3, question: '¿Qué está preparando?', options: ['Un examen', 'La cena', 'Un viaje'], answer: 0 },
    ],
  },
  // ---- Unidad 12 · De compras
  {
    id: 's12b', unitId: 'u12', icon: '☕', title: 'En la cafetería', partner: { name: '服务员', icon: '🙋' },
    lines: [
      L('服务员', '你好！你要什么？', 'Nǐ hǎo! Nǐ yào shénme?', '¡Hola! ¿Qué quieres?'),
      L('bao', '我要一杯咖啡和一杯牛奶。', 'Wǒ yào yì bēi kāfēi hé yì bēi niúnǎi.', 'Un café y un vaso de leche.'),
      L('服务员', '咖啡二十元，牛奶十元。', 'Kāfēi èrshí yuán, niúnǎi shí yuán.', 'El café, veinte yuanes; la leche, diez.'),
      L('bao', '给你五十元。', 'Gěi nǐ wǔshí yuán.', 'Aquí tiene cincuenta.'),
      L('服务员', '找你二十元。谢谢！', 'Zhǎo nǐ èrshí yuán. Xièxie!', 'Le devuelvo veinte. ¡Gracias!'),
    ],
    questions: [
      { after: 1, question: '¿Qué pide Bao?', options: ['Dos cafés', 'Un café y una leche', 'Un té'], answer: 1 },
      { after: 4, question: '¿Cuánto le devuelven?', options: ['20 yuanes', '30 yuanes', '50 yuanes'], answer: 0 },
    ],
  },
  {
    id: 's12c', unitId: 'u12', icon: '🎫', title: 'Un regalo', partner: { name: '小王', icon: '🧑' },
    lines: [
      L('小王', '宝宝，我送你两张票！', 'Bǎobao, wǒ sòng nǐ liǎng zhāng piào!', '¡Baobao, te regalo dos entradas!'),
      L('bao', '什么票？', 'Shénme piào?', '¿Entradas de qué?'),
      L('小王', '电影票。明天晚上的。', 'Diànyǐng piào. Míngtiān wǎnshang de.', 'De cine. Para mañana por la noche.'),
      L('bao', '太好了！谢谢你！我给你买一件衣服吧。', 'Tài hǎo le! Xièxie nǐ! Wǒ gěi nǐ mǎi yí jiàn yīfu ba.', '¡Genial! ¡Gracias! Te compro una prenda de ropa.'),
      L('小王', '不用！', 'Bú yòng!', '¡No hace falta!'),
    ],
    questions: [
      { after: 2, question: '¿Qué le regala Xiao Wang?', options: ['Ropa', 'Dos entradas de cine', 'Un libro'], answer: 1 },
      { after: 3, question: '¿Qué quiere comprarle Bao?', options: ['Ropa', 'Un café', 'Entradas'], answer: 0 },
    ],
  },
  // ---- Unidad 13 · Moverse
  {
    id: 's13b', unitId: 'u13', icon: '🚪', title: 'Buscando el aula', partner: { name: '同学', icon: '🧒' },
    lines: [
      L('bao', '请问，汉语教室在哪里？', 'Qǐngwèn, Hànyǔ jiàoshì zài nǎlǐ?', 'Perdona, ¿dónde está el aula de chino?'),
      L('同学', '你向前走，在左边。', 'Nǐ xiàng qián zǒu, zài zuǒbiān.', 'Sigue recto; está a la izquierda.'),
      L('bao', '离这里远吗？', 'Lí zhèlǐ yuǎn ma?', '¿Está lejos de aquí?'),
      L('同学', '不远，很近。门旁边就是。', 'Bù yuǎn, hěn jìn. Mén pángbiān jiù shì.', 'No, está muy cerca. Es justo al lado de la puerta.'),
      L('bao', '谢谢！我进去了。', 'Xièxie! Wǒ jìnqu le.', '¡Gracias! Voy a entrar.'),
    ],
    questions: [
      { after: 1, question: '¿Dónde está el aula?', options: ['A la derecha', 'A la izquierda', 'Fuera'], answer: 1 },
      { after: 3, question: '¿Está lejos?', options: ['No, junto a la puerta', 'Sí, muy lejos', 'No lo sabe'], answer: 0 },
    ],
  },
  {
    id: 's13c', unitId: 'u13', icon: '🚲', title: 'En bici a la escuela', partner: { name: '小王', icon: '🧑' },
    lines: [
      L('小王', '你每天怎么来学校？', 'Nǐ měi tiān zěnme lái xuéxiào?', '¿Cómo vienes cada día a la escuela?'),
      L('bao', '我骑自行车。', 'Wǒ qí zìxíngchē.', 'En bici.'),
      L('小王', '从你家到学校要多长时间？', 'Cóng nǐ jiā dào xuéxiào yào duō cháng shíjiān?', '¿Cuánto tardas de tu casa a la escuela?'),
      L('bao', '二十分钟。你呢？', 'Èrshí fēnzhōng. Nǐ ne?', 'Veinte minutos. ¿Y tú?'),
      L('小王', '我坐公共汽车，要一个小时。', 'Wǒ zuò gōnggòng qìchē, yào yí gè xiǎoshí.', 'Yo voy en autobús; tardo una hora.'),
    ],
    questions: [
      { after: 1, question: '¿Cómo va Bao a la escuela?', options: ['En autobús', 'En bici', 'Andando'], answer: 1 },
      { after: 4, question: '¿Cuánto tarda Xiao Wang?', options: ['Una hora', '20 minutos', 'Dos horas'], answer: 0 },
    ],
  },
  // ---- Unidad 14 · Salud y deporte
  {
    id: 's14b', unitId: 'u14', icon: '🏀', title: '¿Qué deporte te gusta?', partner: { name: '小王', icon: '🧑' },
    lines: [
      L('小王', '宝宝，你喜欢什么运动？', 'Bǎobao, nǐ xǐhuan shénme yùndòng?', 'Baobao, ¿qué deporte te gusta?'),
      L('bao', '我喜欢游泳和跑步。你呢？', 'Wǒ xǐhuan yóuyǒng hé pǎobù. Nǐ ne?', 'Me gustan nadar y correr. ¿Y a ti?'),
      L('小王', '我喜欢打篮球。', 'Wǒ xǐhuan dǎ lánqiú.', 'A mí, el baloncesto.'),
      L('bao', '明天我们一起去打篮球吧！', 'Míngtiān wǒmen yìqǐ qù dǎ lánqiú ba!', '¡Mañana vamos a jugar al baloncesto juntos!'),
      L('小王', '好！运动对身体很好。', 'Hǎo! Yùndòng duì shēntǐ hěn hǎo.', '¡Vale! El deporte es bueno para la salud.'),
    ],
    questions: [
      { after: 1, question: '¿Qué deportes le gustan a Bao?', options: ['Baloncesto', 'Nadar y correr', 'Fútbol'], answer: 1 },
      { after: 3, question: '¿Qué harán mañana?', options: ['Jugar al baloncesto', 'Nadar', 'Correr'], answer: 0 },
    ],
  },
  {
    id: 's14c', unitId: 'u14', icon: '🎤', title: 'Noche de canciones', partner: { name: '姐姐', icon: '👩' },
    lines: [
      L('姐姐', '宝宝，晚上我们去唱歌跳舞吧！', 'Bǎobao, wǎnshang wǒmen qù chànggē tiàowǔ ba!', '¡Baobao, esta noche vamos a cantar y bailar!'),
      L('bao', '我不会跳舞。', 'Wǒ bú huì tiàowǔ.', 'No sé bailar.'),
      L('姐姐', '没关系，我们一起玩！', 'Méi guānxi, wǒmen yìqǐ wán!', '¡No pasa nada, nos divertimos juntos!'),
      L('bao', '好，我会唱歌！', 'Hǎo, wǒ huì chànggē!', '¡Vale, yo sé cantar!'),
      L('姐姐', '太好了！', 'Tài hǎo le!', '¡Genial!'),
    ],
    questions: [
      { after: 1, question: '¿Qué no sabe hacer Bao?', options: ['Cantar', 'Bailar', 'Nadar'], answer: 1 },
      { after: 3, question: '¿Qué sí sabe hacer?', options: ['Cantar', 'Bailar', 'Jugar al baloncesto'], answer: 0 },
    ],
  },
  // ---- Unidad 15 · En clase
  {
    id: 's15b', unitId: 'u15', icon: '❓', title: 'No entiendo este ejercicio', partner: { name: '同学', icon: '🧒' },
    lines: [
      L('bao', '这个题我不懂，你能帮助我吗？', 'Zhège tí wǒ bù dǒng, nǐ néng bāngzhù wǒ ma?', 'No entiendo este ejercicio, ¿me puedes ayudar?'),
      L('同学', '可以。这个字的意思是“回答”。', 'Kěyǐ. Zhège zì de yìsi shì “huídá”.', 'Claro. Este carácter significa «responder».'),
      L('bao', '我知道了！谢谢你！', 'Wǒ zhīdào le! Xièxie nǐ!', '¡Ya lo entiendo! ¡Gracias!'),
      L('同学', '不客气。明天有考试，你准备好了吗？', 'Bú kèqi. Míngtiān yǒu kǎoshì, nǐ zhǔnbèi hǎo le ma?', 'De nada. Mañana hay examen, ¿estás preparado?'),
      L('bao', '我觉得我准备好了。', 'Wǒ juéde wǒ zhǔnbèi hǎo le.', 'Creo que sí.'),
    ],
    questions: [
      { after: 0, question: '¿Qué le pide Bao?', options: ['Su móvil', 'Ayuda con un ejercicio', 'Un libro'], answer: 1 },
      { after: 3, question: '¿Qué hay mañana?', options: ['Un examen', 'Clase de música', 'Nada'], answer: 0 },
    ],
  },
  {
    id: 's15c', unitId: 'u15', icon: '📱', title: '¿Dónde está mi móvil?', partner: { name: '老师', icon: '👩' },
    lines: [
      L('bao', '老师，我找不到我的手机。', 'Lǎoshī, wǒ zhǎo bu dào wǒ de shǒujī.', 'Profesora, no encuentro mi móvil.'),
      L('老师', '你上课的时候在哪里？', 'Nǐ shàngkè de shíhou zài nǎlǐ?', '¿Dónde estabas durante la clase?'),
      L('bao', '我在教室里。', 'Wǒ zài jiàoshì lǐ.', 'En el aula.'),
      L('老师', '我告诉你：它在桌子上！', 'Wǒ gàosu nǐ: tā zài zhuōzi shang!', 'Te lo digo yo: ¡está encima de la mesa!'),
      L('bao', '太好了！谢谢老师！', 'Tài hǎo le! Xièxie lǎoshī!', '¡Genial! ¡Gracias, profesora!'),
    ],
    questions: [
      { after: 0, question: '¿Qué le pasa a Bao?', options: ['No entiende un ejercicio', 'No encuentra su móvil', 'Está enfermo'], answer: 1 },
      { after: 3, question: '¿Dónde está el móvil?', options: ['Encima de la mesa', 'En casa', 'En el autobús'], answer: 0 },
    ],
  },
  // ---- Unidad 16 · Conectar ideas
  {
    id: 's16b', unitId: 'u16', icon: '❄️', title: 'Un día de nieve', partner: { name: '小王', icon: '🧑' },
    lines: [
      L('小王', '今天下雪了！', 'Jīntiān xià xuě le!', '¡Hoy ha nevado!'),
      L('bao', '因为下雪，所以我要多穿衣服。', 'Yīnwèi xià xuě, suǒyǐ wǒ yào duō chuān yīfu.', 'Como nieva, tengo que abrigarme más.'),
      L('小王', '今天比昨天冷。', 'Jīntiān bǐ zuótiān lěng.', 'Hoy hace más frío que ayer.'),
      L('bao', '但是雪很漂亮！我们出去玩吧！', 'Dànshì xuě hěn piàoliang! Wǒmen chūqu wán ba!', '¡Pero la nieve es preciosa! ¡Salgamos a jugar!'),
      L('小王', '好！这是我第一次看见雪！', 'Hǎo! Zhè shì wǒ dì-yī cì kànjiàn xuě!', '¡Vale! ¡Es la primera vez que veo la nieve!'),
    ],
    questions: [
      { after: 1, question: '¿Qué va a hacer Bao por la nieve?', options: ['Quedarse en casa', 'Ponerse más ropa', 'Ir a nadar'], answer: 1 },
      { after: 4, question: '¿Es la primera vez que Xiao Wang ve la nieve?', options: ['Sí', 'No', 'No lo dice'], answer: 0 },
    ],
  },
  {
    id: 's16c', unitId: 'u16', icon: '🏯', title: 'Recuerdos de Pekín', partner: { name: '老师', icon: '👩' },
    lines: [
      L('老师', '宝宝，你去年去中国了吗？', 'Bǎobao, nǐ qùnián qù Zhōngguó le ma?', 'Baobao, ¿fuiste a China el año pasado?'),
      L('bao', '去了！我去了北京。', 'Qù le! Wǒ qù le Běijīng.', '¡Sí! Fui a Pekín.'),
      L('老师', '北京怎么样？', 'Běijīng zěnmeyàng?', '¿Qué tal Pekín?'),
      L('bao', '很大，人也很多。但是我很喜欢。', 'Hěn dà, rén yě hěn duō. Dànshì wǒ hěn xǐhuan.', 'Muy grande y con mucha gente. Pero me encantó.'),
      L('老师', '你还想再去吗？', 'Nǐ hái xiǎng zài qù ma?', '¿Quieres volver?'),
      L('bao', '想！我希望再去一次！', 'Xiǎng! Wǒ xīwàng zài qù yí cì!', '¡Sí! ¡Espero volver otra vez!'),
    ],
    questions: [
      { after: 1, question: '¿Adónde fue Bao el año pasado?', options: ['Shanghái', 'Pekín', 'No fue'], answer: 1 },
      { after: 5, question: '¿Quiere volver?', options: ['Sí, espera volver', 'No', 'No lo sabe'], answer: 0 },
    ],
  },
];

const unitNumber = (s: Story) => Number(s.unitId.slice(1));

/** Todas las historias, ordenadas por unidad (la principal primero). */
export const STORIES: Story[] = [...MAIN, ...EXTRA].sort((a, b) => unitNumber(a) - unitNumber(b));

/** Notas culturales/gramaticales que aparecen al final de algunas historias. */
export const STORY_NOTES: Record<string, string> = {
  s1: 'El nombre chino de Bao es 宝宝 (Bǎobao), «tesoro». Xiao Wang es una forma cariñosa de llamar a alguien de apellido Wang: 小 (pequeño) + apellido.',
  s4: 'En un restaurante, 我想… es la forma educada de pedir: «quisiera…».',
  s6: '到了！ significa «¡ya hemos llegado!»: 了 indica el cambio de situación.',
  s12: '西瓜怎么卖？ («¿cómo se vende la sandía?») es la forma típica de preguntar el precio en un mercado.',
  s14: '你怎么了？ = «¿qué te pasa?». Se usa cuando alguien parece estar mal.',
  s16: '哪里哪里 es la respuesta modesta a un elogio: literalmente «¿dónde, dónde?».',
};
