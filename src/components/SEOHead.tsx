import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

const BASE_URL = 'https://latters8.github.io/FretLab';
const SITE_NAME = 'FretLab';
const DEFAULT_DESCRIPTION = 'Профессиональная интерактивная гитарная платформа с AI-генерацией соло, DAW-микшером, тюнером и игровой комнатой для гитаристов.';
const DEFAULT_KEYWORDS = 'гитара онлайн, обучение гитаре, AI генератор соло, guitar learning, гитарный тюнер, DAW онлайн, fretboard, табулатуры, аккорды, музыкальная теория, fretlab';
const DEFAULT_OG_IMAGE = `${BASE_URL}/hero.png`;

const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  ogTitle,
  ogDescription,
  ogImage = DEFAULT_OG_IMAGE,
}) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — интерактивная гитарная платформа с AI | Онлайн-тренажёр для гитаристов`;
  const ogTitleFinal = ogTitle || title || SITE_NAME;
  const ogDescFinal = ogDescription || description;

  return (
    <Helmet>
      {/* Title */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph */}
      <meta property="og:title" content={ogTitleFinal} />
      <meta property="og:description" content={ogDescFinal} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={BASE_URL} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter Card */}
      <meta name="twitter:title" content={ogTitleFinal} />
      <meta name="twitter:description" content={ogDescFinal} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
};

export default SEOHead;

