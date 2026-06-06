import {
  SiLaravel,
  SiFlutter,
  SiPython,
  SiTensorflow,
  SiFastapi,
  SiReact,
  SiNextdotjs,
  SiNodedotjs,
  SiTypescript,
  SiJavascript,
  SiMongodb,
  SiMysql,
  SiPostgresql,
  SiFirebase,
  SiApacheairflow,
  SiIota,
  SiOpenai,
  SiGooglecloud,
  
  SiKeras,
  SiOpencv,
  SiScikitlearn,
  SiPytorch,
  SiRedux,
  SiDocker,
  SiGit,
  SiGithub,
  SiFramer,
  SiTailwindcss,
  SiHtml5,
  SiCss,
  SiLinux,
  SiVercel,
  SiGooglegemini,
  SiElevenlabs,
  SiPhp
} from "react-icons/si";

import { FaMicrochip, FaBrain, FaGlobe, FaMobileAlt, FaServer, FaDatabase, FaCode, FaNetworkWired } from "react-icons/fa";
import { FaAws as SiAmazon } from "react-icons/fa";
import { ReactNode } from "react";

type TechIconMap = {
  [key: string]: ReactNode;
};

export const techIcons: TechIconMap = {
  // Framework & Language
  "Laravel": <SiLaravel className="text-red-500" size={16} />,
  "Flutter": <SiFlutter className="text-blue-400" size={16} />,
  "Python": <SiPython className="text-yellow-400" size={16} />,
  "Tensorflow": <SiTensorflow className="text-orange-500" size={16} />,
  "Keras": <SiKeras className="text-red-400" size={16} />,
  "FastAPI": <SiFastapi className="text-teal-500" size={16} />,
  "React": <SiReact className="text-blue-400" size={16} />,
  "Next.js": <SiNextdotjs className="text-black" size={16} />,
  "Node.js": <SiNodedotjs className="text-green-500" size={16} />,
  "TypeScript": <SiTypescript className="text-blue-600" size={16} />,
  "JavaScript": <SiJavascript className="text-yellow-500" size={16} />,
  "HTML": <SiHtml5 className="text-orange-500" size={16} />,
  "CSS": <SiCss className="text-blue-500" size={16} />,
  "TailwindCSS": <SiTailwindcss className="text-sky-500" size={16} />,
  "Java Native": <SiJavascript className="text-orange-500" size={16} />,
  "PHP Native": <SiPhp className="text-blue-600" size={16} />,

  // Machine Learning & AI
  "Machine Learning": <FaMicrochip className="text-pink-500" size={16} />,
  "AI": <FaBrain className="text-purple-500" size={16} />,
  "Deep Learning": <FaMicrochip className="text-indigo-500" size={16} />,
  "Convolusional Neural Network": <FaMicrochip className="text-purple-600" size={16} />,
  "Scikit-Learn": <SiScikitlearn className="text-yellow-600" size={16} />,
  "PyTorch": <SiPytorch className="text-orange-600" size={16} />,
  "OpenCV": <SiOpencv className="text-cyan-500" size={16} />,
  "OpenAI": <SiOpenai className="text-gray-500" size={16} />,

  // Platform & Deployment
  "Vercel": <SiVercel className="text-black" size={16} />,
  "Firebase": <SiFirebase className="text-yellow-500" size={16} />,
  "AWS": <SiAmazon className="text-orange-500" size={16} />,
  "GCP": <SiGooglecloud className="text-blue-400" size={16} />,
  "Docker": <SiDocker className="text-blue-500" size={16} />,

  // UI/UX & Styling
  "Tailwind CSS": <SiTailwindcss className="text-sky-400" size={16} />,
  "Framer Motion": <SiFramer className="text-pink-400" size={16} />,

  // Tools & Others
  "Git": <SiGit className="text-orange-500" size={16} />,
  "GitHub": <SiGithub className="text-black" size={16} />,
  "Redux": <SiRedux className="text-purple-600" size={16} />,
  "Midtrans": <SiApacheairflow className="text-black" size={16} />,
  "Gemini API": <SiGooglegemini className="text-black" size={16} />,
  "ElevenLabs AI": <SiElevenlabs className="text-black" size={16} />,

  // Database
  "MongoDB": <SiMongodb className="text-green-600" size={16} />,
  "MySQL": <SiMysql className="text-blue-600" size={16} />,
  "PostgreSQL": <SiPostgresql className="text-blue-500" size={16} />,
  "Database": <FaDatabase className="text-gray-500" size={16} />,

  // Application Type
  "Web App": <FaGlobe className="text-blue-500" size={16} />,
  "Mobile App": <FaMobileAlt className="text-green-500" size={16} />,
  "IoT Device": <SiIota className="text-amber-500" size={16} />,

  // Network / API
  "API": <FaNetworkWired className="text-cyan-500" size={16} />,
  "Server": <FaServer className="text-gray-600" size={16} />,
  "Linux": <SiLinux className="text-black" size={16} />,
};

export const getTechIcon = (techName: string): ReactNode => {
  return techIcons[techName] || <FaCode className="text-gray-500" size={16} />;
};
