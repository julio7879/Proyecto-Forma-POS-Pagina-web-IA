import fs from 'fs';
import path from 'path';

function cleanSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function cleanCode(text, maxLen = 4) {
  const cleaned = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  return cleaned.substring(0, maxLen) || 'GEN';
}

const clothingItems = [
  { name: 'Vestido Midi Seda Champagne', cat: 'Ropa', price: 185000, desc: 'Vestido fluido de corte midi en satén de seda color champagne con tirantes ajustables y caída elegante.', img: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80', sizes: ['XS', 'S', 'M', 'L'], colors: ['Champagne', 'Negro', 'Esmeralda'] },
  { name: 'Blazer Entallado Obsidian Black', cat: 'Ropa', price: 245000, desc: 'Blazer estructurado con solapa de pico y forro satinado. Silueta moderna entallada para eventos o ejecutiva.', img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80', sizes: ['S', 'M', 'L', 'XL'], colors: ['Negro', 'Azul Marino'] },
  { name: 'Camisa Lino Italiano Blanco Puro', cat: 'Ropa', price: 135000, desc: 'Camisa confeccionada en 100% lino de tacto fresco con botones de nácar natural y cuello resort.', img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80', sizes: ['S', 'M', 'L', 'XL'], colors: ['Blanco', 'Arena', 'Azul Cielo'] },
  { name: 'Pantalón Wide Leg Tiro Alto', cat: 'Ropa', price: 160000, desc: 'Pantalón sastre con pinzas frontales y caída recta amplia en tela crepe premium anti-arrugas.', img: 'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?w=600&auto=format&fit=crop&q=80', sizes: ['XS', 'S', 'M', 'L'], colors: ['Beige', 'Negro', 'Verde Oliva'] },
  { name: 'Jean Mom Fit Denim Premium', cat: 'Ropa', price: 145000, desc: 'Pantalón vaquero de mezclilla 100% algodón colombiano con lavado vintage y tiro alto favorecedor.', img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80', sizes: ['6', '8', '10', '12', '14'], colors: ['Azul Clásico', 'Celeste Vintage'] },
  { name: 'Chaqueta Biker Cuero Sintético', cat: 'Ropa', price: 220000, desc: 'Cazadora estilo biker con cremalleras metálicas plateadas, forro térmico ligero y solapas con broches.', img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80', sizes: ['S', 'M', 'L'], colors: ['Negro', 'Marrón Café'] },
  { name: 'Falda Plisada Satinada Soleada', cat: 'Ropa', price: 125000, desc: 'Falda de largo midi con pliegues definidos en tejido brillante satinado y pretina elástica confortable.', img: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&auto=format&fit=crop&q=80', sizes: ['S', 'M', 'L'], colors: ['Dorado Bronce', 'Verde Bosque', 'Borgoña'] },
  { name: 'Camiseta Básica Pima Cotton', cat: 'Ropa', price: 55000, desc: 'Camiseta unisex cuello redondo en algodón Pima peinado de alta densidad con costuras reforzadas.', img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80', sizes: ['S', 'M', 'L', 'XL'], colors: ['Blanco', 'Negro', 'Gris Jaspe', 'Azul Marino'] },
  { name: 'Buzo Cuello Tortuga Cashmere Touch', cat: 'Ropa', price: 110000, desc: 'Suéter de tejido de punto fino tacto cachemira con cuello vuelto suave que no pica.', img: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&auto=format&fit=crop&q=80', sizes: ['S', 'M', 'L'], colors: ['Crudo', 'Negro', 'Terracota'] },
  { name: 'Polo Piqué Clásico Formal', cat: 'Ropa', price: 89000, desc: 'Camiseta tipo polo en tejido piqué suave de algodón con cuello camisero rígido y abertura de dos botones.', img: 'https://images.unsplash.com/photo-1625910513413-5bc21743a4e1?w=600&auto=format&fit=crop&q=80', sizes: ['S', 'M', 'L', 'XL'], colors: ['Azul Rey', 'Blanco', 'Vinotinto'] },
  { name: 'Enterizo Asimétrico de Noche', cat: 'Ropa', price: 195000, desc: 'Jumpsuit con escote a un hombro y pantalón recto palazzo en crepé elastizado de gran caída.', img: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&auto=format&fit=crop&q=80', sizes: ['S', 'M', 'L'], colors: ['Negro Noche', 'Rojo Rubí'] },
  { name: 'Bermuda Chino Casual Verano', cat: 'Ropa', price: 95000, desc: 'Short estilo chino en sarga de algodón stretch con bolsillos ojal y largo sobre la rodilla.', img: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&auto=format&fit=crop&q=80', sizes: ['30', '32', '34', '36'], colors: ['Caqui', 'Azul Naval', 'Verde Militar'] },
  { name: 'Top Lencero Encaje Delicado', cat: 'Ropa', price: 68000, desc: 'Top de tirantes finos en satén con detalle de encaje floral festoneado en el escote en V.', img: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80', sizes: ['XS', 'S', 'M'], colors: ['Marfil', 'Negro', 'Rosa Palo'] },
  { name: 'Cardigan Tejido Trenzado Boho', cat: 'Ropa', price: 140000, desc: 'Chaqueta de punto trenzado artesanal abierta con botones de carey y silueta oversize relajada.', img: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&auto=format&fit=crop&q=80', sizes: ['S', 'M', 'L'], colors: ['Avena', 'Gris Perla'] },
  { name: 'Vestido Camisero Lino Floral', cat: 'Ropa', price: 175000, desc: 'Vestido abotonado de largo midi con cinturón del mismo tejido y estampado botánico exclusivo.', img: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80', sizes: ['S', 'M', 'L'], colors: ['Floral Verde', 'Floral Terracota'] },
  { name: 'Pantalón Jogger Urbano Streetwear', cat: 'Ropa', price: 115000, desc: 'Jogger de algodón afelpado con elásticos en tobillos, bolsillos con cremallera y cordón ajustable.', img: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600&auto=format&fit=crop&q=80', sizes: ['S', 'M', 'L', 'XL'], colors: ['Gris Antracita', 'Negro', 'Camel'] },
  { name: 'Camisa Denim Lavada Clásica', cat: 'Ropa', price: 120000, desc: 'Camisa vaquera de botones a presión nacarados con doble bolsillo en el pecho y canesú en punta.', img: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=600&auto=format&fit=crop&q=80', sizes: ['S', 'M', 'L', 'XL'], colors: ['Denim Claro', 'Denim Oscuro'] },
  { name: 'Falda Denim Tubo Abertura Frontal', cat: 'Ropa', price: 130000, desc: 'Maxi falda vaquera de silueta recta con abertura central y bolsillos tradicionales de 5 puntos.', img: 'https://images.unsplash.com/photo-1582142407894-ec85a1260a46?w=600&auto=format&fit=crop&q=80', sizes: ['6', '8', '10', '12'], colors: ['Azul Lavado', 'Negro Desgastado'] },
  { name: 'Blusa Gasa Mangas Abullonadas', cat: 'Ropa', price: 92000, desc: 'Blusa semitransparente con cuello mao, puños fruncidos y volumen romántico en los hombros.', img: 'https://images.unsplash.com/photo-1564257631407-4deb129f044b?w=600&auto=format&fit=crop&q=80', sizes: ['S', 'M', 'L'], colors: ['Blanco Óptico', 'Lila Pastel', 'Negro'] },
  { name: 'Chaleco Sastre Botonadura Simple', cat: 'Ropa', price: 105000, desc: 'Chaleco de vestir entallado para llevar solo como top o sobre camisas, con espalda ajustable.', img: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80', sizes: ['XS', 'S', 'M', 'L'], colors: ['Gris Espiga', 'Negro', 'Blanco Crema'] },
];

const accessoryItems = [
  { name: 'Gorra Urbana Snapback Obsidian', cat: 'Accesorios', price: 42000, desc: 'Gorra deportiva de 6 paneles estructurados con bordado frontal tonal y ajuste trasero de presión.', img: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&auto=format&fit=crop&q=80', sizes: ['Única'], colors: ['Negro', 'Azul Marino', 'Verde Militar'] },
  { name: 'Bolso Tote Bag Cuero Vacuno', cat: 'Accesorios', price: 280000, desc: 'Bolso shopping amplio en genuino cuero graneado colombiano con compartimento acolchado para laptop 14 pulg.', img: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&auto=format&fit=crop&q=80', sizes: ['Única'], colors: ['Miel Caramelo', 'Negro Onix', 'Vino Tinto'] },
  { name: 'Bolso Bandolera Crossbody Chain', cat: 'Accesorios', price: 165000, desc: 'Cartera estructurada de tamaño mediano con solapa magnética y cadena dorada convertible a hombro.', img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80', sizes: ['Única'], colors: ['Negro', 'Verde Esmeralda', 'Beige Latte'] },
  { name: 'Billetera Bifold Cuero Genuino', cat: 'Accesorios', price: 78000, desc: 'Billetera compacta de doble pliegue con protección RFID anti-escaneo y 8 ranuras para tarjetas.', img: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&auto=format&fit=crop&q=80', sizes: ['Única'], colors: ['Café Tabaco', 'Negro Carbono'] },
  { name: 'Cinturón Sastre Hebilla Dorada', cat: 'Accesorios', price: 62000, desc: 'Cinturón fino de 2.5cm en cuero legítimo con hebilla geométrica de latón bañado en oro satinado.', img: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600&auto=format&fit=crop&q=80', sizes: ['S (85cm)', 'M (95cm)', 'L (105cm)'], colors: ['Negro', 'Suela'] },
  { name: 'Gafas de Sol Aviador Polarizadas UV400', cat: 'Accesorios', price: 95000, desc: 'Montura metálica ultraligera con lentes de cristal mineral polarizado protección UV400 categoría 3.', img: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80', sizes: ['Única'], colors: ['Dorado con Verde', 'Negro Total'] },
  { name: 'Collar Cadena Eslabones Acero 18k', cat: 'Accesorios', price: 58000, desc: 'Choker de eslabones tipo grumetta en acero quirúrgico 316L con triple baño electrolítico en oro de 18k.', img: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80', sizes: ['Única (42cm)'], colors: ['Dorado', 'Plateado'] },
  { name: 'Aretes Argollas Chunky Texturizadas', cat: 'Accesorios', price: 42000, desc: 'Aretes de aro hueco ultraligeros con cierre de clip seguro y textura trenzada reflectante.', img: 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=600&auto=format&fit=crop&q=80', sizes: ['Única'], colors: ['Oro 18k', 'Plata 925'] },
  { name: 'Reloj Minimalista Cuarzo Mesh Band', cat: 'Accesorios', price: 185000, desc: 'Reloj analógico con esfera de cristal zafiro resistente a rayones y malla de acero milanesa ajustable.', img: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80', sizes: ['38mm', '42mm'], colors: ['Negro Mate', 'Plata Clásica', 'Oro Rosa'] },
  { name: 'Sombrero Fedora de Lana Australiana', cat: 'Accesorios', price: 120000, desc: 'Sombrero rígido ala media elaborado en 100% fieltro de lana con cinta perimetral de piel natural.', img: 'https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=600&auto=format&fit=crop&q=80', sizes: ['M (57cm)', 'L (59cm)'], colors: ['Negro', 'Camel', 'Gris Ceniza'] },
  { name: 'Tenis Urbanos Blancos Minimal', cat: 'Accesorios', price: 210000, desc: 'Sneakers en cuero vacuno blanco con suela de caucho vulcanizado cosida y plantilla anatómica en memory foam.', img: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80', sizes: ['36', '37', '38', '39', '40', '41', '42'], colors: ['Blanco Puro', 'Blanco con Talonera Verde'] },
  { name: 'Botines Chelsea Cuero Nobuk', cat: 'Accesorios', price: 260000, desc: 'Botín clásico tobillero con elásticos laterales y suela track dentada anti-deslizante de gran agarre.', img: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&auto=format&fit=crop&q=80', sizes: ['37', '38', '39', '40', '41', '42'], colors: ['Marrón Tabaco', 'Negro Carbón'] },
  { name: 'Tacones Stiletto Nude 8.5cm', cat: 'Accesorios', price: 175000, desc: 'Zapatos de salón con puntera afilada y tacón aguja de 8.5cm forrado en cuero con almohadilla metatarsal.', img: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&auto=format&fit=crop&q=80', sizes: ['35', '36', '37', '38', '39'], colors: ['Nude Rosado', 'Negro Charol'] },
  { name: 'Mocasines Penny Loafers Cuero', cat: 'Accesorios', price: 195000, desc: 'Mocasín artesanal con antifaz tradicional y vira cosida a mano, ideal para oficina o atuendo formal.', img: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600&auto=format&fit=crop&q=80', sizes: ['39', '40', '41', '42', '43'], colors: ['Burdeos Oxblood', 'Negro'] },
  { name: 'Pañuelo de Seda Estampado Botánico', cat: 'Accesorios', price: 45000, desc: 'Foulard cuadrado de 70x70cm en twill de seda artificial con remate a mano en los bordes.', img: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&auto=format&fit=crop&q=80', sizes: ['Única (70x70)'], colors: ['Verde Selva', 'Azul Marino Oro'] },
];

const cosmeticItems = [
  { name: 'Sérum Ácido Hialurónico Puro 2% + B5', cat: 'Cosméticos', price: 68000, desc: 'Fórmula hidratante multicapa con tres pesos moleculares de ácido hialurónico y provitamina B5 calmante 30ml.', img: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80', sizes: ['30ml', '60ml'], colors: ['Neutro'], nonReturn: true },
  { name: 'Sérum Vitamina C 15% + Ácido Ferúlico', cat: 'Cosméticos', price: 79000, desc: 'Antioxidante iluminador que neutraliza radicales libres, unifica el tono y estimula la síntesis de colágeno.', img: 'https://images.unsplash.com/photo-1608248597359-0f666f21226b?w=600&auto=format&fit=crop&q=80', sizes: ['30ml'], colors: ['Neutro'], nonReturn: true },
  { name: 'Crema Hidratante Ceramid Barrier 50ml', cat: 'Cosméticos', price: 62000, desc: 'Emulsión restauradora con 3 ceramidas esenciales, colesterol y niacinamida para reparar la barrera cutánea.', img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80', sizes: ['50ml', '100ml'], colors: ['Neutro'], nonReturn: true },
  { name: 'Protector Solar Toque Seco FPS 50+', cat: 'Cosméticos', price: 75000, desc: 'Fluido ultraligero de absorción inmediata con filtros fotoestables amplio espectro UVA/UVB y efecto mate.', img: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80', sizes: ['50ml'], colors: ['Invisible'], nonReturn: true },
  { name: 'Contorno de Ojos Cafeína 5% + EGCG', cat: 'Cosméticos', price: 54000, desc: 'Gel descongestionante para bolsas y ojeras oscuras enriquecido con extracto de té verde y péptidos tensores.', img: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&auto=format&fit=crop&q=80', sizes: ['15ml'], colors: ['Neutro'], nonReturn: true },
  { name: 'Tónico Exfoliante Ácido Glicólico 7%', cat: 'Cosméticos', price: 58000, desc: 'Solución tonificante que suaviza la textura de la piel, limpia los poros y potencia la luminosidad natural.', img: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600&auto=format&fit=crop&q=80', sizes: ['150ml'], colors: ['Neutro'], nonReturn: true },
  { name: 'Limpiador Facial Espumoso pH Balanceado', cat: 'Cosméticos', price: 46000, desc: 'Gel limpiador suave con aminoácidos botánicos que retira impurezas y maquillaje sin resecar la piel.', img: 'https://images.unsplash.com/photo-1556228722-d0b71f3089d8?w=600&auto=format&fit=crop&q=80', sizes: ['200ml'], colors: ['Neutro'], nonReturn: true },
  { name: 'Aceite Facial Regenerador Rosa Mosqueta', cat: 'Cosméticos', price: 49000, desc: '100% puro aceite virgen prensado en frío rico en ácidos grasos omega 3, 6 y 9 para nutrir pieles secas.', img: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&auto=format&fit=crop&q=80', sizes: ['30ml'], colors: ['Dorado Natural'], nonReturn: true },
  { name: 'Agua Micelar Desmaquillante Calmante', cat: 'Cosméticos', price: 38000, desc: 'Fórmula enriquecida con agua de rosas y glicerina vegetal para rostro, ojos y labios sensibles.', img: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=600&auto=format&fit=crop&q=80', sizes: ['250ml', '400ml'], colors: ['Neutro'], nonReturn: true },
  { name: 'Mascarilla Facial Purificante Arcilla Verde', cat: 'Cosméticos', price: 42000, desc: 'Tratamiento semanal detoxificante con arcilla bentonita y aceite de árbol de té para matificar y calmar rojeces.', img: 'https://images.unsplash.com/photo-1567928815104-b7980ee07078?w=600&auto=format&fit=crop&q=80', sizes: ['100g'], colors: ['Verde Herbal'], nonReturn: true },
];

const makeupItems = [
  { name: 'Labial Mate Terciopelo Larga Duración', cat: 'Cosméticos', price: 34000, desc: 'Barra de labios con textura cremosa que seca en un acabado mate aterciopelado indeleble de hasta 12 horas.', img: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&auto=format&fit=crop&q=80', sizes: ['Única (4g)'], colors: ['Rojo Borgoña', 'Nude Rosa', 'Terracota Cálido', 'Vino Tinto'], nonReturn: true },
  { name: 'Base Líquida Acabado Segunda Piel FPS 20', cat: 'Cosméticos', price: 72000, desc: 'Base de maquillaje fluida cobertura graduable con ácido hialurónico y pigmentos reflectores de luz.', img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80', sizes: ['30ml'], colors: ['Porcelana 01', 'Vainilla 02', 'Beige Natural 03', 'Caramelo 04', 'Café Cálido 05'], nonReturn: true },
  { name: 'Corrector Iluminador Alta Cobertura', cat: 'Cosméticos', price: 42000, desc: 'Corrector cremoso enriquecido con cafeína que camufla ojeras e imperfecciones sin marcar líneas finas.', img: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&auto=format&fit=crop&q=80', sizes: ['8ml'], colors: ['Fair Light', 'Medium Warm', 'Deep Honey'], nonReturn: true },
  { name: 'Paleta de Sombras Nude Earth 12 Tonos', cat: 'Cosméticos', price: 88000, desc: '12 sombras en acabados mate mantecosos, satinados brillantes y glitters prensados de alta pigmentación.', img: 'https://images.unsplash.com/photo-1583241800698-e8ab01c85b27?w=600&auto=format&fit=crop&q=80', sizes: ['Paleta 12g'], colors: ['Tonos Tierra y Oro'], nonReturn: true },
  { name: 'Máscara de Pestañas Efecto Pestañina HD', cat: 'Cosméticos', price: 38000, desc: 'Cepillo de silicona curvo que alarga, define y engrosa pestaña por pestaña sin dejar grumos ni transferir.', img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&auto=format&fit=crop&q=80', sizes: ['10ml'], colors: ['Negro Intenso'], nonReturn: true },
  { name: 'Delineador Líquido Plumón Waterproof', cat: 'Cosméticos', price: 32000, desc: 'Punta de fieltro ultrafina de 0.1mm para trazos milimétricos continuos con tinta a prueba de agua y sudor.', img: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=600&auto=format&fit=crop&q=80', sizes: ['1.2ml'], colors: ['Negro Carbón', 'Marrón Chocolate'], nonReturn: true },
  { name: 'Polvo Translúcido Fijador Matificante', cat: 'Cosméticos', price: 48000, desc: 'Polvo suelto micro-molido que sella el maquillaje, difumina poros y controla el brillo durante todo el día.', img: 'https://images.unsplash.com/photo-1503236823255-94609f598e71?w=600&auto=format&fit=crop&q=80', sizes: ['25g'], colors: ['Translúcido Universal'], nonReturn: true },
  { name: 'Rubor Compacto Sedoso Iluminador', cat: 'Cosméticos', price: 39000, desc: 'Polvo sedoso enriquecido con minerales que aporta un rubor saludable y luminoso en las mejillas.', img: 'https://images.unsplash.com/photo-1515688594390-b649af70d282?w=600&auto=format&fit=crop&q=80', sizes: ['6g'], colors: ['Durazno Dorado', 'Rosa Romántico', 'Terracota Glow'], nonReturn: true },
  { name: 'Fijador de Maquillaje Hidratante Bruma', cat: 'Cosméticos', price: 45000, desc: 'Spray fijador de bruma ultrafina con extracto de té blanco que prolonga la duración del maquillaje 16h.', img: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80', sizes: ['100ml'], colors: ['Bruma Refrescante'], nonReturn: true },
  { name: 'Aceite Labial Hidratante Lip Glow Oil', cat: 'Cosméticos', price: 36000, desc: 'Aceite nutritivo no pegajoso con extracto de cereza y aceite de jojoba que realza el tono natural de los labios.', img: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&auto=format&fit=crop&q=80', sizes: ['6ml'], colors: ['Cereza Brillante', 'Miel Dorada', 'Rosa Suave'], nonReturn: true },
];

const allItems = [...clothingItems, ...accessoryItems, ...cosmeticItems, ...makeupItems];

console.log(`Catálogo base: ${allItems.length} modelos maestros.`);

let code = `// backend/prisma/seeds/catalogSeedData.ts
// Catálogo Maestro Masivo con 105 productos y 500+ variantes SKU con precios COP enteros (RN-GEN-04)

export interface VarianteSemilla {
  sku: string;
  talla: string;
  color: string;
  precioVentaCop: number;
}

export interface ProductoSemilla {
  nombre: string;
  slug: string;
  descripcion: string;
  categoriaNombre: 'Ropa' | 'Accesorios' | 'Cosméticos' | 'Artesanías';
  reintegrableEnDevolucion: boolean;
  imagenesUrls: string[];
  variantes: VarianteSemilla[];
}

export const CATALOGO_MAESTRO_130: ProductoSemilla[] = [\n`;

let totalVariantes = 0;
let productoIndex = 1;

for (const item of allItems) {
  const slug = cleanSlug(item.name);
  const catCode = item.cat === 'Ropa' ? 'ROP' : item.cat === 'Accesorios' ? 'ACC' : 'COS';
  const prodNum = String(productoIndex).padStart(3, '0');

  const variantes = [];
  let varIdx = 1;
  for (const c of item.colors) {
    const colorCode = cleanCode(c, 3);
    for (const s of item.sizes) {
      const sizeCode = cleanCode(s, 3);
      const sku = `${catCode}-${prodNum}-${colorCode}-${sizeCode}-${varIdx}`;
      variantes.push({
        sku,
        talla: s,
        color: c,
        precioVentaCop: item.price
      });
      totalVariantes++;
      varIdx++;
    }
  }

  code += `  {
    nombre: ${JSON.stringify(item.name)},
    slug: ${JSON.stringify(slug)},
    descripcion: ${JSON.stringify(item.desc)},
    categoriaNombre: ${JSON.stringify(item.cat)},
    reintegrableEnDevolucion: ${item.nonReturn ? false : true},
    imagenesUrls: [${JSON.stringify(item.img)}],
    variantes: ${JSON.stringify(variantes, null, 6)}
  },\n`;

  productoIndex++;
}

// 50 productos derivados Colección Cápsula Edición Oro 2026
const coleccion2026 = allItems.slice(0, 50).map((it) => {
  return {
    ...it,
    name: `${it.name} (Edición Oro 2026)`,
    price: Math.floor(it.price * 1.15 / 1000) * 1000,
    desc: `${it.desc} Versión especial de la colección 2026 con acabados reforzados y empaque conmemorativo.`,
  };
});

for (const item of coleccion2026) {
  const slug = cleanSlug(item.name);
  const catCode = item.cat === 'Ropa' ? 'ROP' : item.cat === 'Accesorios' ? 'ACC' : 'COS';
  const prodNum = String(productoIndex).padStart(3, '0');

  const variantes = [];
  let varIdx = 1;
  for (const c of item.colors.slice(0, 2)) {
    const colorCode = cleanCode(c, 3);
    for (const s of item.sizes.slice(0, 3)) {
      const sizeCode = cleanCode(s, 3);
      const sku = `${catCode}-ED26-${prodNum}-${colorCode}-${sizeCode}-${varIdx}`;
      variantes.push({
        sku,
        talla: s,
        color: c,
        precioVentaCop: item.price
      });
      totalVariantes++;
      varIdx++;
    }
  }

  code += `  {
    nombre: ${JSON.stringify(item.name)},
    slug: ${JSON.stringify(slug)},
    descripcion: ${JSON.stringify(item.desc)},
    categoriaNombre: ${JSON.stringify(item.cat)},
    reintegrableEnDevolucion: ${item.nonReturn ? false : true},
    imagenesUrls: [${JSON.stringify(item.img)}],
    variantes: ${JSON.stringify(variantes, null, 6)}
  },\n`;

  productoIndex++;
}

code += `];\n`;

fs.writeFileSync(path.join(process.cwd(), 'backend', 'prisma', 'seeds', 'catalogSeedData.ts'), code, 'utf-8');
console.log(`✅ Archivo catalogSeedData.ts regenerado con ${productoIndex - 1} productos y ${totalVariantes} variantes SKU 100% únicas.`);
