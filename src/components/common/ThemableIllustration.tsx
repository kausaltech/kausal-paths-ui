import { useTheme } from '@common/themes';

/*
https://unsplash.com/illustrations/sustainable-energy-sources-powering-homes-and-industry-mOD9LFSvIiw
*/

type Props = {
  maxHeight?: number;
};

const ThemableIllustration = ({ maxHeight = 400 }: Props) => {
  const theme = useTheme();

  return (
    <svg
      viewBox="0 0 767 558"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        width: '100%',
        height: 'auto',
        maxWidth: (maxHeight * 767) / 558,
        display: 'block',
        margin: '0 auto',
      }}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M394.751 42.214c135.227 0 244.841 109.651 244.841 244.914 0 135.271-109.614 244.921-244.841 244.921-135.219 0-244.834-109.65-244.834-244.921 0-135.263 109.615-244.914 244.834-244.914Zm0 147.4c53.845 0 97.483 43.659 97.483 97.514s-43.638 97.515-97.483 97.515c-53.837 0-97.482-43.66-97.482-97.515 0-53.855 43.645-97.514 97.482-97.514Z"
        fill={theme.graphColors.green010}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M205.419 270.493h35.522c4.416 0 3.783-11.847-4.972-9.116 0 0-1.403-7.499-8.693-7.499-7.284 0-8.198 7.781-8.198 7.781s-7.002-2.174-7.284 4.417c0 0-5.818-1.266-6.375 4.417Z"
        fill={theme.graphColors.grey010}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M517.11 499.308c-5.578-20.412-20.647-41.285-57.655-23.721 0 0-13.28-49.748-53.122-35.823 0 0-24.312-25.586-44.133 3.983 0 0-35.963-10.808-47.813 28.709 0 0-25.461 1.239-34.023 31.262a243.835 243.835 0 0 0 30.728 13.657h167.325a243.965 243.965 0 0 0 38.693-18.067Zm-22.93-312.673h69.167s-12.42-40.57-42.792-31.268c0 0-.385-46.927-42.214-32.762 0 0-14.14-44.182-56.355-20.295 0 0-29.229-45.868-67.242-7.61 0 0-44.704-38.258-66.478 18.604 0 0-44.512-13.953-43.363 42.063 0 0-32.476-.42-33.432 31.282l282.709-.014Z"
        fill={theme.graphColors.green070}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M286.677 79.937v106.698h91.974V80.576l-44.519-45.062-47.455 44.423Z"
        fill={theme.graphColors.red010}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M278.225 116.262v70.6h60.859v-70.181l-29.456-29.817-31.403 29.398Z"
        fill={theme.graphColors.red010}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M309.627 86.864h33.26l26.864 29.817h-30.667l-29.457-29.817Z"
        fill={theme.graphColors.blue070}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M339.084 116.682h30.64v70.18h-30.64v-70.18Z"
        fill={theme.graphColors.red030}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M334.132 35.514h118.432l40.591 45.062H378.651l-44.519-45.062Z"
        fill={theme.graphColors.blue070}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M378.651 80.576h114.47v106.059h-114.47V80.576Z"
        fill={theme.graphColors.red030}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M382.867 35.513h-29.622v-13.74h29.622v13.74Zm-61.609 151.349h-22.112V154.94h22.112v31.922Zm-14.76-51.151h-10.096v-14.798h10.096v14.798Zm16.314 0h-10.096v-14.798h10.096v14.798Zm136.994-24.816h-7.882V99.351h7.882v11.544Zm9.45 0h-7.882V99.351h7.882v11.544Zm-9.45 12.872h-7.882v-11.551h7.882v11.551Zm9.45 0h-7.882v-11.551h7.882v11.551Zm-45.516-12.872h-7.882V99.351h7.882v11.544Zm9.443 0h-7.882V99.351h7.882v11.544Zm-9.443 12.872h-7.882v-11.551h7.882v11.551Zm9.443 0h-7.882v-11.551h7.882v11.551Zm26.623 23.378h-7.882v-11.544h7.882v11.544Zm9.45 0h-7.882v-11.544h7.882v11.544Zm-9.45 12.872h-7.882v-11.551h7.882v11.551Zm9.45 0h-7.882v-11.551h7.882v11.551Zm-45.516-12.872h-7.882v-11.544h7.882v11.544Zm9.443 0h-7.882v-11.544h7.882v11.544Zm-9.443 12.872h-7.882v-11.551h7.882v11.551Zm9.443 0h-7.882v-11.551h7.882v11.551Z"
        fill={theme.graphColors.blue070}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M238.197 233.246h59.581c7.407 0 6.348-19.862-8.343-15.28 0 0-2.352-12.576-14.573-12.576-12.222 0-13.749 13.044-13.749 13.044s-11.753-3.64-12.221 7.409c0 0-9.753-2.119-10.695 7.403Z"
        fill={theme.graphColors.grey010}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="m261.787 364.63 1.286-89.341h5.372l2.854 89.341h-9.512Z"
        fill={theme.graphColors.red010}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="m270.769 273.885 34.959 14.771.77-2.085s-26.912-16.677-27.737-16.656c-.825.028-6.355 1.459-6.355 1.459l-1.637 2.511Zm-11.059-3.688-35.564 13.237.867 2.05s31.018-6.329 31.602-6.914c.585-.585 3.632-5.421 3.632-5.421l-.537-2.952Z"
        fill={theme.graphColors.blue070}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="m266.643 275.289 1.231 89.341h3.425l-2.854-89.341h-1.802Z"
        fill={theme.graphColors.red030}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M263.885 265.299a6.612 6.612 0 0 1 7.889 9.332 6.627 6.627 0 0 1-6.431 3.564 6.604 6.604 0 0 1-5.75-4.579 6.617 6.617 0 0 1 4.292-8.317Z"
        fill={theme.graphColors.red010}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="m268.307 265.437 4.409-37.702-2.222-.158s-8.487 30.505-8.232 31.289c.254.792 3.418 6.117 3.418 6.117l2.627.454Zm-3.604 2.435a3.924 3.924 0 0 1 2.986.248 3.919 3.919 0 0 1 2.109 3.806 3.913 3.913 0 0 1-5.696 3.154 3.92 3.92 0 0 1-1.937-2.289 3.921 3.921 0 0 1 2.538-4.919Z"
        fill={theme.graphColors.blue070}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M330.707 374.605c-2.73-8.187-13.549-33.401-41.32-26.088 0 0-8.79-31.049-35.165-22.359 0 0-16.094-15.968-29.216 2.483 0 0-23.803-6.742-31.65 17.929 0 0-21.665.984-24.134 28.035h161.492-.007Z"
        fill={theme.graphColors.green070}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="m190.976 374.55 1.946-135.683h8.164l4.333 135.683h-14.443Z"
        fill={theme.graphColors.blue030}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="m204.614 236.741 53.095 22.428 1.176-3.172s-40.873-25.317-42.125-25.283c-1.259.027-9.656 2.208-9.656 2.208l-2.49 3.819Zm-16.795-5.607-54.016 20.109 1.327 3.11s47.098-9.618 47.992-10.498c.887-.888 5.509-8.236 5.509-8.236l-.812-4.485Z"
        fill={theme.graphColors.blue070}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="m198.355 238.867 1.864 135.683h5.2l-4.333-135.683h-2.731Z"
        fill={theme.graphColors.red030}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M194.153 223.69c5.289-1.686 10.942 1.224 12.634 6.515 1.692 5.29-1.224 10.946-6.513 12.631-5.282 1.693-10.942-1.224-12.627-6.508-1.692-5.291 1.224-10.946 6.506-12.638Z"
        fill={theme.graphColors.red010}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="m200.873 223.903 6.699-57.26-3.37-.241s-12.889 46.328-12.504 47.526c.378 1.197 5.193 9.287 5.193 9.287l3.982.688Zm-5.468 3.701a5.937 5.937 0 0 1 6.348 1.822 5.926 5.926 0 0 1 1.121 2.031 5.934 5.934 0 0 1-1.821 6.348 5.934 5.934 0 0 1-2.03 1.123 5.933 5.933 0 0 1-4.533-.378 5.953 5.953 0 0 1-2.559-8.008 5.933 5.933 0 0 1 3.474-2.938Zm301.987 169.133h-64.58v132.375a243.07 243.07 0 0 0 64.58-19.567V396.737Z"
        fill={theme.graphColors.blue070}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M432.812 415.313h-39.601l-31.101-21.3v21.445l-28.72-21.445v21.252l-30.764-21.252v120.094c28.439 11.572 59.539 17.942 92.125 17.942 12.951 0 25.66-1.004 38.061-2.937V415.313Z"
        fill={theme.graphColors.blue030}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="m393.21 415.313 8.157-101.711h21.754l9.69 101.711H393.21Z"
        fill={theme.graphColors.red010}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M412.248 313.602h10.873l9.69 101.711h-12.826l-7.737-101.711Z"
        fill={theme.graphColors.red030}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="m396.354 376.16.907-11.386h30.736l1.087 11.386h-32.73Zm2.407-30.085.832-10.375h25.633l.99 10.375h-27.455Zm1.925-23.976.681-8.497h21.754l.812 8.497h-23.247Z"
        fill={theme.graphColors.blue070}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M403.836 313.602s1.713-43.57 30.344-55.678c28.638-12.102 41.74 12.308 64.732-8.07 22.991-20.372 17.544-53.856 63.927-56.477 46.375-2.621 47.991 44.98 54.243 51.434 6.252 6.46 40.935-9.075 41.341 24.21.399 33.284-91.753 38.327-108.088 31.667-16.334-6.652-23.597-12.507-23.597-12.507s-19.759 18.968-38.713 18.562c-18.962-.406-43.37-31.668-66.788 6.859h-17.401Zm250.653-130.916c11.747 0 21.272 9.529 21.272 21.279 0 11.751-9.525 21.279-21.272 21.279-11.747 0-21.272-9.528-21.272-21.279 0-11.75 9.525-21.279 21.272-21.279Zm32.565 50.628c8.019 0 14.519 6.502 14.519 14.524 0 8.022-6.5 14.523-14.519 14.523s-14.518-6.501-14.518-14.523c0-8.022 6.499-14.524 14.518-14.524Z"
        fill={theme.graphColors.grey010}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M358.218 529.339v-47.12h26.795v49.638a245.47 245.47 0 0 1-26.795-2.518Z"
        fill={theme.graphColors.blue070}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M320.982 436.833h15.296v26.797h-15.296v-26.797Zm28.549 0h15.296v26.797h-15.296v-26.797Zm28.047 0h15.296v26.797h-15.296v-26.797Zm29.401 0h15.296v26.797h-15.296v-26.797Z"
        fill={theme.graphColors.yellow010}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M302.626 394.013v-9.178L333.39 406.3v8.965l-30.764-21.252Zm30.764 0v-9.178l28.72 21.658v8.964l-28.72-21.444Zm28.727 0v-9.178l31.761 22.195-.667 8.283-31.094-21.3Zm126.52-61.719h44.704l21.637 38.108h-44.704l-21.637-38.108Z"
        fill={theme.graphColors.blue070}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M511.972 332.294h1.589l10.021 18.356h20.178l.798 1.396h-20.213l10.014 18.356h-1.582l-10.021-18.356h-22.909l-.791-1.396h22.937l-10.021-18.356Z"
        fill={theme.graphColors.green010}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M520.858 370.401h2.964v26.446h-2.964v-26.446Z"
        fill={theme.graphColors.blue070}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M509.648 396.848h25.075v-2.91h-25.075v2.91Zm28.679-81.609h44.711l21.637 38.114h-44.711l-21.637-38.114Z"
        fill={theme.graphColors.blue070}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M561.697 315.239h1.589l10.02 18.356h20.152l.797 1.403H574.07l10.02 18.355h-1.588l-10.021-18.355h-22.937l-.791-1.403h22.965l-10.021-18.356Z"
        fill={theme.graphColors.green010}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M266.739 485.948c-17.49.715-38.617-21.679-16.651-42.256 0 0-.536-30.072 16.651-30.643 17.187.571 16.651 30.643 16.651 30.643 21.96 20.577.839 42.971-16.651 42.256Z"
        fill={theme.graphColors.green070}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M570.548 353.354h2.971v26.439h-2.971v-26.439Z"
        fill={theme.graphColors.blue070}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M559.455 379.792h25.075v-3.068h-25.075v3.068Z"
        fill={theme.graphColors.blue070}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M443.162 437.019h45.894v3.481h-45.894v-3.481Zm0 12.033h45.894v3.488h-45.894v-3.488Zm0 11.338h45.894v3.488h-45.894v-3.488Zm0 12.032h45.894v3.488h-45.894v-3.488Z"
        fill={theme.graphColors.blue030}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M247.833 197.732a7.267 7.267 0 0 1 7.262 7.259 7.264 7.264 0 0 1-7.262 7.265c-4.01 0-7.256-3.254-7.256-7.265a7.257 7.257 0 0 1 7.256-7.259Z"
        fill={theme.graphColors.grey010}
      />
      <path d="M265.694 499.962v-61.375h2.09v61.375h-2.09Z" fill={theme.graphColors.blue070} />
      <path
        d="m255.921 461.504 11.478 9.301-1.32 1.617-11.472-9.301 1.314-1.617Zm10.185 2.786 12.868-9.804 1.273 1.658-12.875 9.811-1.266-1.665Z"
        fill={theme.graphColors.blue070}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M406.979 482.363h15.296v26.797h-15.296v-26.797Zm-85.997-1.155h15.296v26.796h-15.296v-26.796Z"
        fill={theme.graphColors.yellow010}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M527.564 480.017c-16.61.681-36.685-20.598-15.819-40.143 0 0-.509-28.572 15.819-29.116 16.334.544 15.818 29.116 15.818 29.116 20.873 19.545.798 40.824-15.818 40.143Z"
        fill={theme.graphColors.green070}
      />
      <path d="M526.518 493.33v-58.307h2.098v58.307h-2.098Z" fill={theme.graphColors.blue070} />
      <path
        d="m517.323 456.757 10.901 8.834-1.314 1.623-10.901-8.84 1.314-1.617Zm9.608 2.649 12.235-9.323 1.266 1.665-12.229 9.316-1.272-1.658Z"
        fill={theme.graphColors.blue070}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M229.126 387.113c7.93 0 14.36 6.432 14.36 14.365 0 7.939-6.43 14.372-14.36 14.372-7.937 0-14.367-6.433-14.367-14.372 0-7.933 6.43-14.365 14.367-14.365Z"
        fill={theme.graphColors.yellow030}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M538.128 173.034c-16.617.674-36.685-20.598-15.819-40.144 0 0-.509-28.572 15.819-29.115 16.334.543 15.818 29.115 15.818 29.115 20.873 19.546.798 40.818-15.818 40.144Z"
        fill={theme.graphColors.green070}
      />
      <path d="M537.082 186.346V128.04h2.098v58.306h-2.098Z" fill={theme.graphColors.blue070} />
      <path
        d="m527.887 149.767 10.901 8.84-1.314 1.617-10.901-8.834 1.314-1.623Zm9.608 2.655 12.228-9.322 1.273 1.658-12.229 9.322-1.272-1.658Z"
        fill={theme.graphColors.blue070}
      />
    </svg>
  );
};

export default ThemableIllustration;
