/// <reference types="nativewind/types" />

export {};

declare module '*.png' {
  const value: number;
  export default value;
}

declare module 'react-native' {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface ScrollViewProps {
    className?: string;
    contentContainerClassName?: string;
  }
  interface ImagePropsBase {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
    placeholderClassName?: string;
  }
  interface TouchableWithoutFeedbackProps {
    className?: string;
  }
  interface TouchableOpacityProps {
    className?: string;
  }
}
