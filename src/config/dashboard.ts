/** 驾驶舱静态配置:指数、大宗商品、产业链 */

export interface IndexDef {
  code: string;
  label: string;
  region: "CN" | "HK" | "US" | "FX";
}

export const INDICES: IndexDef[] = [
  { code: "sh000001", label: "上证指数", region: "CN" },
  { code: "sz399001", label: "深证成指", region: "CN" },
  { code: "sz399006", label: "创业板指", region: "CN" },
  { code: "sh000688", label: "科创50", region: "CN" },
  { code: "sh000300", label: "沪深300", region: "CN" },
  { code: "sh000905", label: "中证500", region: "CN" },
  { code: "hkHSI", label: "恒生指数", region: "HK" },
  { code: "hkHSTECH", label: "恒生科技", region: "HK" },
  { code: "usDJI", label: "道琼斯", region: "US" },
  { code: "usIXIC", label: "纳斯达克", region: "US" },
  { code: "usINX", label: "标普500", region: "US" },
  { code: "usVIX", label: "恐慌指数", region: "US" },
];

export const FOREX: IndexDef[] = [{ code: "whUSDCNY", label: "美元/人民币", region: "FX" }];

export interface CommodityDef {
  code: string;
  label: string;
  unit: string;
  accent: string;
}

export const COMMODITIES: CommodityDef[] = [
  { code: "hf_GC", label: "纽约黄金", unit: "COMEX · 美元/盎司", accent: "#f5c542" },
  { code: "hf_XAU", label: "伦敦金", unit: "现货 · 美元/盎司", accent: "#ffca28" },
  { code: "nf_AU0", label: "沪金", unit: "元/克", accent: "#e6c25a" },
  { code: "hf_SI", label: "纽约白银", unit: "COMEX · 美元/盎司", accent: "#c0d0e0" },
  { code: "hf_CAD", label: "LME伦铜", unit: "美元/吨", accent: "#e8833a" },
  { code: "hf_CL", label: "NYMEX原油", unit: "美元/桶", accent: "#5aa9e6" },
  { code: "BTCUSDT", label: "BTC/USDT", unit: "美元", accent: "#f7931a" },
];

export interface ChainStock {
  code: string;
  name: string;
  tag?: string;
  price?: number;
  pct?: number;
  amount?: number;
  turnover?: number;
  source?: string;
}

export interface ChainSegment {
  name: string;
  desc: string;
  query?: string;
  include?: string[];
  exclude?: string[];
  stocks?: ChainStock[];
}

export interface Chain {
  id: string;
  name: string;
  icon: string;
  segments: ChainSegment[];
  tech: string[];
  keywords: string[];
}

export const CHAINS: Chain[] = [
  {
    id: "semi",
    name: "半导体",
    icon: "◈",
    segments: [
      {
        name: "上游 · 设备与材料",
        desc: "光刻/刻蚀/薄膜沉积 · 硅片/光刻胶",
        query: "A股，半导体设备或半导体材料或光刻胶或半导体硅片，非ST，非退市，按成交额从高到低排序",
        stocks: [
          { code: "sz002371", name: "北方华创", tag: "设备龙头" },
          { code: "sh688012", name: "中微公司", tag: "刻蚀设备" },
          { code: "sh688126", name: "沪硅产业", tag: "大硅片" },
          { code: "sz002409", name: "雅克科技", tag: "电子材料" },
          { code: "sh688037", name: "芯源微", tag: "涂胶显影" },
        ],
      },
      {
        name: "中游 · 制造与封测",
        desc: "晶圆代工 · 封装测试",
        query: "A股，晶圆代工或半导体封测或先进封装或Chiplet，非ST，非退市，按成交额从高到低排序",
        stocks: [
          { code: "sh688981", name: "中芯国际", tag: "代工龙头" },
          { code: "sh688347", name: "华虹公司", tag: "特色工艺" },
          { code: "sh600584", name: "长电科技", tag: "封测龙头" },
          { code: "sz002156", name: "通富微电", tag: "先进封装" },
          { code: "sh688249", name: "晶合集成", tag: "晶圆代工" },
        ],
      },
      {
        name: "下游 · 设计与应用",
        desc: "芯片设计 · 终端应用",
        query: "A股，芯片设计或AI芯片或存储芯片或射频芯片，非ST，非退市，按成交额从高到低排序",
        stocks: [
          { code: "sh603501", name: "韦尔股份", tag: "CIS图像" },
          { code: "sz300782", name: "卓胜微", tag: "射频前端" },
          { code: "sh603986", name: "兆易创新", tag: "存储/MCU" },
          { code: "sh688256", name: "寒武纪", tag: "AI芯片" },
          { code: "sh688008", name: "澜起科技", tag: "内存接口" },
        ],
      },
    ],
    tech: ["EUV光刻", "先进封装 Chiplet", "HBM 高带宽存储", "SiC/GaN 第三代半导体", "EDA 国产化", "RISC-V"],
    keywords: ["半导体", "芯片", "晶圆", "光刻", "存储", "封测", "中芯", "台积电", "EDA", "先进封装", "碳化硅", "氮化镓"],
  },
  {
    id: "semi-materials",
    name: "半导体耗材",
    icon: "◇",
    segments: [
      {
        name: "上游 · 晶圆制造耗材",
        desc: "硅片/特气/CMP/光刻胶/湿化学/靶材/掩膜版",
        stocks: [
          { code: "sh688126", name: "沪硅产业", tag: "大硅片" },
          { code: "sh605358", name: "立昂微", tag: "硅片/功率" },
          { code: "sz002129", name: "TCL中环", tag: "硅材料" },
          { code: "sh688233", name: "神工股份", tag: "硅材料" },
          { code: "sh688432", name: "有研硅", tag: "硅片" },
          { code: "sh688146", name: "中船特气", tag: "电子特气" },
          { code: "sh688268", name: "华特气体", tag: "电子特气" },
          { code: "sz300346", name: "南大光电", tag: "光刻胶/特气" },
          { code: "sz002409", name: "雅克科技", tag: "电子材料" },
          { code: "sh688106", name: "金宏气体", tag: "电子特气" },
          { code: "sh688548", name: "广钢气体", tag: "电子大宗气" },
          { code: "sh688019", name: "安集科技", tag: "CMP抛光液" },
          { code: "sz300054", name: "鼎龙股份", tag: "CMP/抛光垫" },
          { code: "sh603650", name: "彤程新材", tag: "光刻胶" },
          { code: "sz300655", name: "晶瑞电材", tag: "湿化学/光刻胶" },
          { code: "sz300236", name: "上海新阳", tag: "湿化学/电镀" },
          { code: "sh688549", name: "中巨芯", tag: "湿电子化学品" },
          { code: "sh603931", name: "格林达", tag: "显影液" },
          { code: "sz300666", name: "江丰电子", tag: "溅射靶材" },
          { code: "sh600206", name: "有研新材", tag: "高纯材料" },
          { code: "sz300706", name: "阿石创", tag: "靶材" },
          { code: "sz300263", name: "隆华科技", tag: "靶材/高纯材料" },
          { code: "sh688138", name: "清溢光电", tag: "掩膜版" },
          { code: "sh688401", name: "路维光电", tag: "掩膜版" },
        ],
      },
      {
        name: "中游 · 设备零部件耗材",
        desc: "半导体设备/精密零部件/FOUP/晶圆载具",
        stocks: [
          { code: "sz002371", name: "北方华创", tag: "半导体设备" },
          { code: "sh688012", name: "中微公司", tag: "刻蚀设备" },
          { code: "sh688072", name: "拓荆科技", tag: "薄膜沉积" },
          { code: "sh688120", name: "华海清科", tag: "CMP设备" },
          { code: "sh688082", name: "盛美上海", tag: "清洗设备" },
          { code: "sz300151", name: "昌红科技", tag: "FOUP/载具" },
        ],
      },
      {
        name: "下游 · 封测耗材",
        desc: "引线框架/封装基板/塑封料/硅微粉/载带盖带",
        stocks: [
          { code: "sh600584", name: "长电科技", tag: "封测龙头" },
          { code: "sz002156", name: "通富微电", tag: "封测" },
          { code: "sh688300", name: "联瑞新材", tag: "硅微粉" },
          { code: "sh688535", name: "华海诚科", tag: "塑封料" },
          { code: "sz002859", name: "洁美科技", tag: "载带/盖带" },
        ],
      },
    ],
    tech: ["大硅片", "电子特气", "CMP 抛光液/垫", "光刻胶", "湿电子化学品", "靶材/掩膜版"],
    keywords: ["半导体耗材", "硅片", "电子特气", "CMP", "光刻胶", "湿电子化学品", "靶材", "掩膜版", "封装材料", "FOUP"],
  },
  {
    id: "ai",
    name: "AI算力",
    icon: "◉",
    segments: [
      {
        name: "上游 · 芯片与光模块",
        desc: "GPU/ASIC · 光通信器件",
        query: "A股，AI芯片或GPU或光模块或CPO或光通信器件，非ST，非退市，按成交额从高到低排序",
        stocks: [
          { code: "sh688041", name: "海光信息", tag: "国产CPU/DCU" },
          { code: "sh688256", name: "寒武纪", tag: "AI ASIC" },
          { code: "sz300308", name: "中际旭创", tag: "光模块龙头" },
          { code: "sz300502", name: "新易盛", tag: "高速光模块" },
          { code: "sz300394", name: "天孚通信", tag: "光器件" },
        ],
      },
      {
        name: "中游 · 服务器与IDC",
        desc: "AI服务器 · 数据中心",
        query: "A股，AI服务器或数据中心或IDC或算力租赁，非ST，非退市，按成交额从高到低排序",
        stocks: [
          { code: "sh601138", name: "工业富联", tag: "AI服务器" },
          { code: "sz000977", name: "浪潮信息", tag: "服务器龙头" },
          { code: "sh603019", name: "中科曙光", tag: "高性能计算" },
          { code: "sz300383", name: "光环新网", tag: "IDC服务" },
          { code: "sz002261", name: "拓维信息", tag: "昇腾生态" },
        ],
      },
      {
        name: "下游 · 云与应用",
        desc: "云计算 · AI应用",
        query: "A股，AI应用或AI Agent或大模型或云计算，非ST，非退市，按成交额从高到低排序",
        stocks: [
          { code: "sh688111", name: "金山办公", tag: "AI办公" },
          { code: "sz002230", name: "科大讯飞", tag: "语音大模型" },
          { code: "sh601360", name: "三六零", tag: "AI搜索" },
          { code: "sz300418", name: "昆仑万维", tag: "AGI应用" },
          { code: "sz300624", name: "万兴科技", tag: "AI创意" },
        ],
      },
    ],
    tech: ["国产 GPU", "CPO 光电共封装", "推理加速", "万卡集群", "AI Agent"],
    keywords: ["AI", "算力", "大模型", "英伟达", "GPU", "服务器", "光模块", "数据中心", "智能体", "推理"],
  },
  {
    id: "solid-battery",
    name: "固态电池",
    icon: "▣",
    segments: [
      {
        name: "上游 · 核心材料",
        desc: "锂盐/电解质 · 正负极/导电剂/隔膜",
        query: "A股，固态电池电解质或硫化物电解质或氧化物电解质或锂金属负极或导电剂或碳纳米管或复合集流体或正极材料，非ST，非退市，按成交额从高到低排序",
        include: ["固态电池", "电解质", "硫化物", "氧化物", "锂盐", "锂金属", "正极", "负极", "导电剂", "碳纳米管", "隔膜", "复合集流体"],
        exclude: ["整车", "乘用车", "充电桩", "机器人", "光模块", "半导体", "医药"],
        stocks: [
          { code: "sz002460", name: "赣锋锂业", tag: "锂盐/固态" },
          { code: "sz002466", name: "天齐锂业", tag: "锂矿/锂盐" },
          { code: "sh688116", name: "天奈科技", tag: "碳纳米管" },
          { code: "sh603200", name: "上海洗霸", tag: "固态电解质" },
          { code: "sz002709", name: "天赐材料", tag: "电解液/锂盐" },
          { code: "sh603026", name: "石大胜华", tag: "电解液" },
          { code: "sh688005", name: "容百科技", tag: "高镍正极" },
          { code: "sz300073", name: "当升科技", tag: "正极材料" },
          { code: "sh688778", name: "厦钨新能", tag: "正极材料" },
          { code: "bj835185", name: "贝特瑞", tag: "负极材料" },
          { code: "sh603659", name: "璞泰来", tag: "负极/涂覆" },
          { code: "sz002812", name: "恩捷股份", tag: "隔膜" },
          { code: "sz002632", name: "道明光学", tag: "复合膜材" },
          { code: "sh600210", name: "紫江企业", tag: "铝塑膜" },
          { code: "sz300409", name: "道氏技术", tag: "导电剂/材料" },
        ],
      },
      {
        name: "中游 · 电芯与设备",
        desc: "固态/半固态电芯 · 锂电设备/干法电极",
        query: "A股，固态电池或半固态电池或锂电设备或干法电极或复合集流体或电池设备，非ST，非退市，按成交额从高到低排序",
        include: ["固态电池", "半固态", "电芯", "电池厂商", "动力电池", "锂电设备", "电池设备", "干法电极", "复合集流体"],
        exclude: ["整车", "乘用车", "充电桩", "机器人", "光模块", "半导体", "医药"],
        stocks: [
          { code: "sz300750", name: "宁德时代", tag: "电池龙头" },
          { code: "sz002594", name: "比亚迪", tag: "动力电池" },
          { code: "sz300014", name: "亿纬锂能", tag: "动力/储能" },
          { code: "sz002074", name: "国轩高科", tag: "动力电池" },
          { code: "sz300438", name: "鹏辉能源", tag: "储能电池" },
          { code: "sh688567", name: "孚能科技", tag: "软包动力" },
          { code: "sz300207", name: "欣旺达", tag: "动力/消费" },
          { code: "sh688772", name: "珠海冠宇", tag: "消费电池" },
          { code: "sz300450", name: "先导智能", tag: "锂电设备" },
          { code: "sh688499", name: "利元亨", tag: "锂电设备" },
          { code: "sz300457", name: "赢合科技", tag: "锂电设备" },
          { code: "sz301325", name: "曼恩斯特", tag: "涂布设备" },
          { code: "sh688006", name: "杭可科技", tag: "后段设备" },
          { code: "sh688559", name: "海目星", tag: "激光设备" },
          { code: "bj832522", name: "纳科诺尔", tag: "辊压设备" },
        ],
      },
      {
        name: "下游 · 整车与储能应用",
        desc: "新能源车验证 · 储能系统/逆变器",
        query: "A股，固态电池整车或动力电池应用或储能系统或储能逆变器，非ST，非退市，按成交额从高到低排序",
        include: ["整车", "乘用车", "新能源车", "储能", "储能系统", "储能逆变器", "固态电池应用"],
        exclude: ["光模块", "半导体", "机器人", "医药"],
        stocks: [
          { code: "sh600104", name: "上汽集团", tag: "整车验证" },
          { code: "sh601633", name: "长城汽车", tag: "整车" },
          { code: "sh601127", name: "赛力斯", tag: "整车" },
          { code: "sh600733", name: "北汽蓝谷", tag: "新能源车" },
          { code: "sh601238", name: "广汽集团", tag: "固态电池布局" },
          { code: "sh600418", name: "江淮汽车", tag: "新能源车" },
          { code: "sz300274", name: "阳光电源", tag: "储能逆变器" },
          { code: "sz300693", name: "盛弘股份", tag: "储能PCS" },
          { code: "sh688063", name: "派能科技", tag: "储能电池" },
          { code: "sz002518", name: "科士达", tag: "储能/UPS" },
          { code: "sh605117", name: "德业股份", tag: "储能逆变器" },
          { code: "sh688390", name: "固德威", tag: "储能逆变器" },
        ],
      },
    ],
    tech: ["硫化物电解质", "氧化物电解质", "锂金属负极", "碳纳米管导电剂", "干法电极", "复合集流体"],
    keywords: ["固态电池", "半固态电池", "电解质", "导电剂", "复合集流体", "锂电设备", "储能", "动力电池"],
  },
  {
    id: "satellite",
    name: "商业航天星链",
    icon: "✦",
    segments: [
      {
        name: "上游 · 燃料与器件",
        desc: "液体燃料 · 射频芯片/连接器/材料",
        query: "A股，商业航天或卫星互联网或星链或航天电子或相控阵芯片或射频芯片或火箭燃料，非退市，按成交额从高到低排序",
        include: ["商业航天", "卫星互联网", "卫星导航", "航天电子", "星链", "北斗", "连接器", "相控阵", "射频", "芯片", "燃料", "液化天然气"],
        exclude: ["光模块", "医药", "锂电池", "机器人"],
        stocks: [
          { code: "sh605090", name: "九丰能源", tag: "火箭燃料/LNG" },
          { code: "sz001270", name: "铖昌科技", tag: "相控阵芯片" },
          { code: "sh688270", name: "臻镭科技", tag: "射频芯片" },
          { code: "sh688103", name: "国力股份", tag: "真空器件" },
          { code: "sz300045", name: "华力创通", tag: "卫星通信" },
          { code: "sh688562", name: "航天软件", tag: "航天信息化" },
          { code: "sh600118", name: "中国卫星", tag: "小卫星" },
          { code: "sz300456", name: "赛微电子", tag: "MEMS/导航" },
        ],
      },
      {
        name: "中游 · 火箭与卫星",
        desc: "运载火箭 · 重型装备/卫星制造/测控",
        query: "A股，商业航天或火箭或卫星制造或卫星测控或航天装备，非退市，按成交额从高到低排序",
        include: ["商业航天", "火箭", "卫星制造", "卫星测控", "航天", "空间站", "运载", "重型装备"],
        exclude: ["光模块", "医药", "锂电池", "机器人"],
        stocks: [
          { code: "sh601608", name: "中信重工", tag: "重型装备" },
          { code: "sh600879", name: "航天电子", tag: "航天电子" },
          { code: "sh600343", name: "航天动力", tag: "航天发动机" },
          { code: "sz300159", name: "新研股份", tag: "航空航天" },
          { code: "sh688239", name: "航宇科技", tag: "航空锻件" },
          { code: "sh688562", name: "航天软件", tag: "测控/信息化" },
          { code: "sh600118", name: "中国卫星", tag: "卫星制造" },
        ],
      },
      {
        name: "下游 · 通信与应用",
        desc: "卫星通信 · 遥感/导航应用",
        query: "A股，卫星通信或卫星互联网或遥感或北斗导航应用，非ST，非退市，按成交额从高到低排序",
        include: ["卫星通信", "卫星互联网", "遥感", "北斗", "导航", "低轨卫星", "通信终端"],
        exclude: ["光模块", "医药", "锂电池", "机器人"],
        stocks: [
          { code: "sh601698", name: "中国卫通", tag: "卫星运营" },
          { code: "sz002465", name: "海格通信", tag: "卫星通信" },
          { code: "sz002151", name: "北斗星通", tag: "北斗导航" },
          { code: "sz300627", name: "华测导航", tag: "高精定位" },
          { code: "sz300101", name: "振芯科技", tag: "北斗芯片" },
        ],
      },
    ],
    tech: ["低轨星座", "卫星互联网", "相控阵天线", "北斗高精度", "遥感数据", "可回收火箭"],
    keywords: ["商业航天", "卫星互联网", "星链", "低轨卫星", "北斗", "遥感", "火箭", "航天"],
  },
  {
    id: "fusion",
    name: "核聚变",
    icon: "☼",
    segments: [
      {
        name: "上游 · 材料",
        desc: "超导/钨材料 · 特种金属/抗辐照",
        stocks: [
          { code: "sh688122", name: "西部超导", tag: "超导材料" },
          { code: "sh600105", name: "永鼎股份", tag: "超导/线缆" },
          { code: "sz000969", name: "安泰科技", tag: "特种材料" },
          { code: "sz000962", name: "东方钽业", tag: "钽铌材料" },
          { code: "sz002318", name: "久立特材", tag: "特种管材" },
          { code: "sz000657", name: "中钨高新", tag: "钨材料" },
          { code: "sh600549", name: "厦门钨业", tag: "钨钼材料" },
          { code: "sh600456", name: "宝钛股份", tag: "钛材" },
        ],
      },
      {
        name: "中游 · 设备",
        desc: "磁体/真空室 · 冷却/阀门/电源控制",
        stocks: [
          { code: "sh601727", name: "上海电气", tag: "核电设备" },
          { code: "sh688103", name: "国力股份", tag: "真空器件" },
          { code: "sh600875", name: "东方电气", tag: "能源装备" },
          { code: "sh688776", name: "国光电气", tag: "真空/微波" },
          { code: "sh603011", name: "合锻智能", tag: "成形装备" },
          { code: "sh603699", name: "纽威股份", tag: "工业阀门" },
          { code: "sz000777", name: "中核科技", tag: "核级阀门" },
          { code: "sz002639", name: "雪人股份", tag: "低温/冷却" },
          { code: "sz000811", name: "冰轮环境", tag: "低温系统" },
          { code: "sh601179", name: "中国西电", tag: "电源控制" },
          { code: "sz000400", name: "许继电气", tag: "电力装备" },
          { code: "sh603308", name: "应流股份", tag: "核电设备" },
        ],
      },
      {
        name: "下游 · 工程运营",
        desc: "工程建设 · 核电运营/远期电站",
        stocks: [
          { code: "sh601611", name: "中国核建", tag: "核电工程" },
          { code: "sh601985", name: "中国核电", tag: "核电运营" },
          { code: "sz003816", name: "中国广核", tag: "核电运营" },
          { code: "sh600023", name: "浙能电力", tag: "电力平台" },
          { code: "sh601868", name: "中国能建", tag: "能源工程" },
        ],
      },
    ],
    tech: ["高温超导磁体", "真空室", "偏滤器", "冷却系统", "核级阀门", "电源控制"],
    keywords: ["核聚变", "可控核聚变", "托卡马克", "超导材料", "钨材料", "真空室", "偏滤器", "CFETR", "BEST", "EAST", "ITER"],
  },
  {
    id: "robot",
    name: "机器人",
    icon: "◎",
    segments: [
      {
        name: "上游 · 核心零部件",
        desc: "减速器/丝杠 · 传感器/电机",
        query: "A股，机器人减速器或丝杠或传感器或伺服电机或空心杯电机，非ST，非退市，按成交额从高到低排序",
        stocks: [
          { code: "sh688017", name: "绿的谐波", tag: "谐波减速器" },
          { code: "sz002472", name: "双环传动", tag: "精密齿轮" },
          { code: "sh603728", name: "鸣志电器", tag: "空心杯电机" },
          { code: "sh603662", name: "柯力传感", tag: "力传感器" },
          { code: "sz300580", name: "贝斯特", tag: "滚柱丝杠" },
        ],
      },
      {
        name: "中游 · 本体与执行器",
        desc: "机器人本体 · 执行器总成",
        query: "A股，机器人本体或执行器或工业机器人或人形机器人，非ST，非退市，按成交额从高到低排序",
        stocks: [
          { code: "sz002747", name: "埃斯顿", tag: "工业机器人" },
          { code: "sz300124", name: "汇川技术", tag: "伺服系统" },
          { code: "sz002050", name: "三花智控", tag: "执行器" },
          { code: "sh601689", name: "拓普集团", tag: "线性执行器" },
          { code: "sz300660", name: "江苏雷利", tag: "微特电机" },
        ],
      },
      {
        name: "下游 · 整机与场景",
        desc: "人形/服务机器人 · 场景集成",
        query: "A股，人形机器人或服务机器人或具身智能或机器人应用，非ST，非退市，按成交额从高到低排序",
        stocks: [
          { code: "sz300024", name: "机器人", tag: "新松机器人" },
          { code: "sh603666", name: "亿嘉和", tag: "特种机器人" },
          { code: "sh689009", name: "九号公司", tag: "移动机器人" },
          { code: "sh688169", name: "石头科技", tag: "服务机器人" },
          { code: "sh603486", name: "科沃斯", tag: "扫地机器人" },
        ],
      },
    ],
    tech: ["人形机器人", "谐波减速器", "行星滚柱丝杠", "灵巧手", "具身智能大模型", "六维力传感"],
    keywords: ["机器人", "人形", "减速器", "丝杠", "灵巧手", "具身", "Optimus", "Figure", "伺服"],
  },
  {
    id: "pharma",
    name: "创新药",
    icon: "◬",
    segments: [
      {
        name: "上游 · 科研试剂设备",
        desc: "分子砌块/培养基/试剂/动物模型/分析设备/AI制药",
        stocks: [
          { code: "sz300725", name: "药石科技", tag: "分子砌块" },
          { code: "sh688131", name: "皓元医药", tag: "分子砌块" },
          { code: "sh688073", name: "毕得医药", tag: "科研试剂" },
          { code: "sz301080", name: "百普赛斯", tag: "重组蛋白" },
          { code: "sh688690", name: "纳微科技", tag: "色谱填料" },
          { code: "sh688293", name: "奥浦迈", tag: "培养基" },
          { code: "sh688133", name: "泰坦科技", tag: "科研服务" },
          { code: "sh688179", name: "阿拉丁", tag: "科研试剂" },
          { code: "hk02315", name: "百奥赛图", tag: "动物模型" },
          { code: "sh688271", name: "联影医疗", tag: "影像设备" },
        ],
      },
      {
        name: "中游 · CRO/CDMO",
        desc: "药物发现/临床前/临床试验/工艺开发/生产外包",
        stocks: [
          { code: "sh603259", name: "药明康德", tag: "CXO龙头" },
          { code: "sz300759", name: "康龙化成", tag: "一体化CXO" },
          { code: "sz300347", name: "泰格医药", tag: "临床CRO" },
          { code: "sz002821", name: "凯莱英", tag: "CDMO" },
          { code: "sz300363", name: "博腾股份", tag: "CDMO" },
          { code: "sh603127", name: "昭衍新药", tag: "临床前CRO" },
          { code: "sh688202", name: "美迪西", tag: "临床前CRO" },
          { code: "sh688621", name: "阳光诺和", tag: "药学CRO" },
          { code: "sz301257", name: "普蕊斯", tag: "SMO" },
          { code: "sz301333", name: "诺思格", tag: "临床CRO" },
        ],
      },
      {
        name: "下游 · 创新药企",
        desc: "肿瘤/自免/代谢/ADC/双抗/GLP-1",
        stocks: [
          { code: "sh600276", name: "恒瑞医药", tag: "创新药龙头" },
          { code: "sh688235", name: "百济神州", tag: "国际化标杆" },
          { code: "hk01801", name: "信达生物", tag: "PD-1/双抗" },
          { code: "sz002422", name: "科伦药业", tag: "ADC管线" },
          { code: "sh688331", name: "荣昌生物", tag: "ADC/自免" },
          { code: "sh688180", name: "君实生物", tag: "PD-1" },
          { code: "sh688578", name: "艾力斯", tag: "肺癌靶向" },
          { code: "sh688266", name: "泽璟制药", tag: "小分子新药" },
          { code: "sh688506", name: "百利天恒", tag: "ADC/双抗" },
          { code: "sh688177", name: "百奥泰", tag: "抗体药物" },
          { code: "sh688062", name: "迈威生物", tag: "抗体/ADC" },
        ],
      },
    ],
    tech: ["ADC 偶联药物", "双特异性抗体", "GLP-1", "License-out 出海", "CRO/CDMO", "AI 制药"],
    keywords: ["创新药", "ADC", "GLP", "双抗", "License", "CRO", "CDMO", "科研试剂", "药物发现", "临床试验"],
  },
];

/** 宏观关键词 — 快讯高亮 */
export const MACRO_KEYWORDS = [
  "央行", "美联储", "降息", "加息", "降准", "GDP", "CPI", "PMI",
  "财政部", "国债", "专项债", "汇率", "人民币", "关税", "国常会",
];
