import {
  Card,
  CardContent,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Tooltip,
} from "@mui/material";
import { atom, useAtomValue } from "jotai";
import { useTranslation } from "next-i18next";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DoneIcon from "@mui/icons-material/Done";
import {
  FC,
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { monoFontClass } from "../styles/font.css";
import classNames from "classnames";
import { allowInterWordWrapClass } from "../styles/generatedPasswordList.css";

/**
 * Jotai atom for global state of generated password list
 */
export const generatedPasswordListAtom = atom<string[]>([]);

/**
 * Properties for `cancelRef`
 *
 * `cancelRef` is used to assure single copy-success icon (✔) is displayed.
 * If another password is copied, the current icon is canceled and turns to be the normal copy icon.
 */
interface cancelRefProps {
  /**
   * Cancel showing the current copy-success icon (✔) for the formerly-copied password (from the standpoint of the password that has just been copied).
   *
   * If a new password is copied, this value must be changed.
   */
  cancelPrevious: () => void;
  /** Password that has just succeeded in copied. */
  password: string;
}

interface PasswordRowProps {
  /** Generated password */
  password: string;
  /**
   * Shared ref for success-display (✔) cancelation by all `PasswordRow` components
   */
  cancelRef: MutableRefObject<cancelRefProps | null>;
}

/**
 * Corresponds to single password
 *
 * Shows password and makes it possible to copy it by a single click
 */
const PasswordRow: FC<PasswordRowProps> = ({ password, cancelRef }) => {
  const { t } = useTranslation();
  const [copySuccess, setCopySuccess] = useState(false);

  const copyPass = useCallback(async () => {
    await navigator.clipboard.writeText(password);
    setCopySuccess(true);
  }, [password]);
  useEffect(() => {
    if (!copySuccess) return;
    const id = setTimeout(() => setCopySuccess(false), 2000);
    if (cancelRef.current) cancelRef.current.cancelPrevious();
    cancelRef.current = {
      cancelPrevious: () => {
        setCopySuccess(false);
        clearTimeout(id);
        cancelRef.current = null;
      },
      password,
    };
    return () => {
      clearTimeout(id);
      if (cancelRef.current?.password === password) cancelRef.current = null;
    };
  }, [cancelRef, copySuccess, password]);

  return (
    <ListItem
      secondaryAction={
        <Tooltip
          title={t(copySuccess ? "copy_done" : "copy") ?? "Copy"}
          placement="left"
        >
          <IconButton
            edge="end"
            aria-label={t("copy") ?? "Copy"}
            onClick={copyPass}
          >
            {copySuccess ? <DoneIcon /> : <ContentCopyIcon />}
          </IconButton>
        </Tooltip>
      }
    >
      <ListItemText>
        <code className={classNames([monoFontClass, allowInterWordWrapClass])}>
          {password}
        </code>
      </ListItemText>
    </ListItem>
  );
};

/**
 * Component group to display all generated passwords
 */
export const GeneratedPasswordList: FC = () => {
  const passwordList = useAtomValue(generatedPasswordListAtom);
  const { t } = useTranslation();
  const cancelRef = useRef<cancelRefProps | null>(null);

  return (
    <Card component="section">
      <CardContent>
        <h2>{t("generated_pass")}</h2>
        {passwordList.length === 0 && <p>{t("not_yet_generated")}</p>}
        {passwordList.length !== 0 && (
          <List>
            {passwordList.map((pass) => (
              <PasswordRow password={pass} key={pass} cancelRef={cancelRef} />
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};
