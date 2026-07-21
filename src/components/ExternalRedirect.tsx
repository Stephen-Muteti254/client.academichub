import { useEffect } from "react";

interface ExternalRedirectProps {
  to: string;
  replace?: boolean;
}

const ExternalRedirect = ({
  to,
  replace = true,
}: ExternalRedirectProps) => {
  useEffect(() => {
    if (replace) {
      window.location.replace(to);
    } else {
      window.location.assign(to);
    }
  }, [to, replace]);

  return null;
};

export default ExternalRedirect;