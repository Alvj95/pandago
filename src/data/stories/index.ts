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

export const STORIES: Story[] = [
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

/** Notas culturales/gramaticales que aparecen al final de algunas historias. */
export const STORY_NOTES: Record<string, string> = {
  s1: 'El nombre chino de Bao es 宝宝 (Bǎobao), «tesoro». Xiao Wang es una forma cariñosa de llamar a alguien de apellido Wang: 小 (pequeño) + apellido.',
  s4: 'En un restaurante, 我想… es la forma educada de pedir: «quisiera…».',
  s6: '到了！ significa «¡ya hemos llegado!»: 了 indica el cambio de situación.',
  s12: '西瓜怎么卖？ («¿cómo se vende la sandía?») es la forma típica de preguntar el precio en un mercado.',
  s14: '你怎么了？ = «¿qué te pasa?». Se usa cuando alguien parece estar mal.',
  s16: '哪里哪里 es la respuesta modesta a un elogio: literalmente «¿dónde, dónde?».',
};
