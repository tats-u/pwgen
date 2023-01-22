import Fab from "@mui/material/Fab";
import { FC } from "react";
import TwitterIcon from "@mui/icons-material/Twitter";
import GitHubIcon from "@mui/icons-material/GitHub";
import { advertisementContainerClass } from "../styles/advertisement.css";
import { Stack } from "@mui/system";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@mui/material";

interface ButtonProps {
  /**
   * unique ID string (for `key` prop)
   *
   * This is invisible for users
   */
  id: string;
  /** Icon component in `<Fab>` component */
  icon: Parameters<typeof Fab>[0]["children"];
  /** Link URL */
  link: string;
  // | ((
  //     t: ReturnType<typeof useTranslation<"translation", undefined>>["t"]
  //   ) => string);
  /**
   * `true` if `target="_blank"` (open in new tab)
   */
  targetBlank?: boolean | undefined;
  /**
   * Description of button
   *
   * Tooltip title
   */
  description:
    | string
    | ((
        t: ReturnType<typeof useTranslation<"translation", undefined>>["t"]
      ) => string);
  color?: Parameters<typeof Fab>["0"]["color"] | undefined;
}

const buttons: ButtonProps[] = [
  {
    id: "twitter",
    icon: <TwitterIcon />,
    link: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
      "https://pwgen-tats-u.vercel.app/"
    )}`,
    targetBlank: true,
    description: (t) => t("share_on_twitter"),
    color: "info",
  },
  {
    id: "github",
    icon: <GitHubIcon />,
    link: "https://github.com/tats-u/pwgen/",
    description: (t) => t("github_repo"),
    color: "success",
  },
];

const translate = (
  t: ReturnType<typeof useTranslation<"translation", undefined>>["t"],
  str:
    | string
    | ((
        t: ReturnType<typeof useTranslation<"translation", undefined>>["t"]
      ) => string)
) => (typeof str === "function" ? str(t) : str);

/**
 * FABs to advertise this app
 */
export const AdvertisementFab: FC = () => {
  const { t } = useTranslation();
  return (
    <Stack className={advertisementContainerClass} spacing={2}>
      {buttons.map((button) => (
        <a
          // href={translate(t, button.link)}
          href={button.link}
          key={button.id}
          target={button.targetBlank ? "_blank" : undefined}
          rel={button.targetBlank ? "noreferrer" : undefined}
        >
          <Tooltip title={translate(t, button.description)}>
            <Fab color={button.color}>{button.icon}</Fab>
          </Tooltip>
        </a>
      ))}
    </Stack>
  );
};
