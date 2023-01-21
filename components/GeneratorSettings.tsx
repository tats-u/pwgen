import {
  Backdrop,
  Button,
  Card,
  Chip,
  CircularProgress,
  createTheme,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  Input,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  Switch,
  ThemeProvider,
} from "@mui/material";
import ButtonGroup from "@mui/material/ButtonGroup";
import CardContent from "@mui/material/CardContent";
import type { ThemeOptions } from "@mui/material/styles";
import { atom, useAtom, useAtomValue, useSetAtom, WritableAtom } from "jotai";
import { focusAtom } from "jotai-optics";
import { useTranslation } from "next-i18next";
import {
  FC,
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  sliderAndInputControllerContainerClass,
  characterTypeContainerClass,
  characterTypeLabelClass,
  flexChipContainerClass,
  keyTopClass,
  keyTopWrapperClass,
  oneLineDescriptionListClass,
} from "../styles/generatorSettings.css";
import {
  AlNumTableFactory,
  AlNumTableFactoryType,
  FullAlNumTable,
  generatePasswordGeneratorInstance,
  passwordCharsConsecutionPolicies,
  passwordCharsConsecutionPoliciesType,
  sequencedChars,
} from "../utils/generator";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import KeyIcon from "@mui/icons-material/Key";
import Dialog from "@mui/material/Dialog";
import { generatedPasswordListAtom } from "./GeneratedPasswordList";
import { monoFontClass, monoFontFamily } from "../styles/font.css";
import { usePrefersDarkMode } from "../utils/darkMode";

/** Emoji icons before language names */
const languageIcons = {
  en: "🌐",
  ja: "🇯🇵",
} as const;

/** Button groups to switch the global locale (language) */
export const LanguageSwitcher: FC = () => {
  const { t, i18n } = useTranslation();
  return (
    <section>
      <h3>{t("language")}</h3>
      <ButtonGroup
        variant="contained"
        aria-label="outlined primary button group"
      >
        {(["en", "ja"] as const).map((lang) => (
          <Button
            key={lang}
            onClick={() => {
              i18n.changeLanguage(lang);
            }}
          >
            {languageIcons[lang]} {t(`languages.${lang}`)}
          </Button>
        ))}
      </ButtonGroup>
    </section>
  );
};

interface SliderTextFieldPairProps {
  valueAtom: WritableAtom<number, number>;
  /** `true` if components are disabled. `undefined` is treated as `false`. */
  disabled?: boolean | undefined;
  /** Max limit of value (at least slider) */
  max: number;
  /** Min limit of value. `undefined` is treated as `0`. */
  min?: number | undefined;
  /** Max limit for number input */
  inputMax?: number | undefined;
  /** Default (initial) value */
  default: number;
}

/** Set of slider and number input field that share the same value
 *
 * e.g.
 *
 * ```text
 * ---●--- [60]
 * ```
 */
const SliderTextFieldPair: FC<SliderTextFieldPairProps> = (props) => {
  const [value, setValue] = useAtom(props.valueAtom);
  const [textValue, setTextValue] = useState<string | number>(value);

  useEffect(() => {
    setTextValue(value);
  }, [value]);

  const handleSliderChange = useCallback(
    (_event: Event, newValue_: number | number[]) => {
      // @ts-ignore (never be array because range slider feature is not used)
      const newValue: number = newValue_;
      setValue(newValue);
      setTextValue(newValue);
    },
    [setValue]
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setTextValue(event.target.value);
    },
    []
  );

  /**
   * Fixes the input value and reflects it on the slider.
   */
  const fixAndReflectInputValue = useCallback(() => {
    const parseInt = (text: string) => {
      const extracted = text.match(/-?[0-9]+/);
      if (extracted === null) return NaN;
      return Number.parseInt(extracted[0], 10);
    };

    const candidate =
      typeof textValue === "string" ? parseInt(textValue) : textValue;

    const normalized = ((val) => {
      if (Number.isNaN(val)) return props.default;
      if (val < (props.min ?? 0)) return props.min ?? 0;
      if (val > (props.inputMax ?? props.max))
        return props.inputMax ?? props.max;
      return candidate;
    })(candidate);

    setValue(normalized);
    setTextValue(normalized);
  }, [
    props.default,
    props.inputMax,
    props.max,
    props.min,
    setValue,
    textValue,
  ]);

  /**
   * Detects Enter key and calls `fixAndReflectInputValue`.
   */
  const handleKeyDown = useCallback<
    KeyboardEventHandler<HTMLInputElement | HTMLTextAreaElement>
  >(
    (event) => {
      // onKeyDown occurs before onChange
      if (event.nativeEvent.isComposing || event.key !== "Enter") return;
      fixAndReflectInputValue();
    },
    [fixAndReflectInputValue]
  );
  const handleKeyUp = useCallback<
    KeyboardEventHandler<HTMLInputElement | HTMLTextAreaElement>
  >(
    (event) => {
      if (
        event.nativeEvent.isComposing ||
        (event.key !== "ArrowUp" && event.key !== "ArrowDown")
      )
        return;
      fixAndReflectInputValue();
    },
    [fixAndReflectInputValue]
  );

  return (
    <div className={sliderAndInputControllerContainerClass}>
      <Slider
        max={value > props.max ? value : props.max}
        min={props.min ?? 0}
        valueLabelDisplay="auto"
        value={value}
        onChange={handleSliderChange}
        disabled={props.disabled}
      />
      <Input
        value={textValue}
        size="small"
        onChange={handleInputChange}
        onBlur={fixAndReflectInputValue}
        onKeyDown={handleKeyDown} // Enter key
        onKeyUp={handleKeyUp} // Arrow up/down keys
        onMouseUp={fixAndReflectInputValue} // Spin buttons
        onWheel={fixAndReflectInputValue}
        inputProps={{
          min: props.min ?? 0,
          max: props.max,
          type: "number",
        }}
        disabled={props.disabled}
      />
    </div>
  );
};

const maxFrequencyValue = 120;
const initFrequencyValue = maxFrequencyValue / 2;

interface FrequencyChangerPerCharacterTypeProps
  extends Pick<SliderTextFieldPairProps, "disabled" | "valueAtom"> {
  /** name of parameter (kind of characters) */
  name: string;
}

/**
 * Component group to describe and change frequency of single character type
 */
const FrequencyChangerPerCharacterType: FC<
  FrequencyChangerPerCharacterTypeProps
> = (props) => {
  return (
    <section className={characterTypeContainerClass}>
      <h4 className={characterTypeLabelClass}>{props.name}</h4>
      <SliderTextFieldPair
        max={maxFrequencyValue}
        default={initFrequencyValue}
        valueAtom={props.valueAtom}
        disabled={props.disabled}
      />
    </section>
  );
};

/** Initial state of frequency of all character types */
const initFrequency = {
  /** Frequency of alphabets (lower & upper)  */
  alpha: initFrequencyValue,
  /** Frequency of digits  */
  digit: initFrequencyValue,
  /** Frequency of symbols  */
  symbol: initFrequencyValue,
} as const;

const initCharacterTypeEnabled = {
  upper: true,
  digit: true,
  symbol: true,
};

// Causes unknown hydration error
// const frequencyAtom = atomWithStorage("pwgen-frequency", initFrequency)
// const characterTypeDisabledAtom = atomWithStorage(
//   "pwgen-disabled-char-type",
//   initCharacterTypeDisabled
// )
/** Jotai atom of global state of frequency of each character type */
const frequencyAtom = atom(initFrequency);
/** Jotai atom of global state of enabledness of each character type */
const characterTypeEnabledAtom = atom(initCharacterTypeEnabled);

/**
 * Components that manipulate the frequency of character types.
 */
const FrequencyChanger: FC = () => {
  const isTypeEnabled = useAtomValue(characterTypeEnabledAtom);
  const { t } = useTranslation();
  return (
    <section>
      <h3>{t("appearance_ratio")}</h3>
      <FrequencyChangerPerCharacterType
        name={t("alphabets")}
        valueAtom={focusAtom(frequencyAtom, (freq) => freq.prop("alpha"))}
      />
      <FrequencyChangerPerCharacterType
        name={t("digits")}
        valueAtom={focusAtom(frequencyAtom, (freq) => freq.prop("digit"))}
        disabled={!isTypeEnabled.digit}
      />
      <FrequencyChangerPerCharacterType
        name={t("symbols")}
        valueAtom={focusAtom(frequencyAtom, (freq) => freq.prop("symbol"))}
        disabled={!isTypeEnabled.symbol}
      />
    </section>
  );
};

interface CharacterTypeEnablingSwitchProps {
  /** Jotai atom for a single character type */
  valueAtom: WritableAtom<boolean, boolean>;
  /** Name of character type */
  name: string;
}

/**
 * Switch component to toggle enabledness of single character type
 */
const CharacterTypeEnablingSwitch: FC<CharacterTypeEnablingSwitchProps> = (
  props
) => {
  const [enabled, setEnabled] = useAtom(props.valueAtom);
  const handleChange = useCallback<
    Exclude<Parameters<typeof FormControlLabel>[0]["onChange"], undefined>
  >(
    (_event, checked) => {
      setEnabled(checked);
    },
    [setEnabled]
  );

  return (
    <FormControlLabel
      control={<Switch />}
      checked={enabled}
      onChange={handleChange}
      label={props.name}
    />
  );
};

const CharacterTypeDisabler: FC = () => {
  const { t } = useTranslation();

  return (
    <section>
      <h3>{t("appearing_char_type")}</h3>
      <CharacterTypeEnablingSwitch
        valueAtom={focusAtom(characterTypeEnabledAtom, (types) =>
          types.prop("upper")
        )}
        name={t("uppercase")}
      />
      <CharacterTypeEnablingSwitch
        valueAtom={focusAtom(characterTypeEnabledAtom, (types) =>
          types.prop("digit")
        )}
        name={t("digits")}
      />
      <CharacterTypeEnablingSwitch
        valueAtom={focusAtom(characterTypeEnabledAtom, (types) =>
          types.prop("symbol")
        )}
        name={t("symbols")}
      />
    </section>
  );
};

/** Symbols list (based on Japanese JIS keyboard layout) */
const allSymbolsArray = [...sequencedChars("!/:@[`{~")];
/** Means all symbols are enabled */
const allEnabledSymbolsState = Object.fromEntries(
  allSymbolsArray.map((symbol) => [symbol, true])
);
/** Means all symbols are disabled */
const allDisabledSymbolsState = Object.fromEntries(
  allSymbolsArray.map((symbol) => [symbol, false])
);

/** Jotai atom for global state of enabledness of each symbol */
const enabledSymbolsAtom = atom(allEnabledSymbolsState);

interface SymbolActivateChipProps {
  /** Jotai atom for activeness of single symbol */
  activatedAtom: WritableAtom<boolean, boolean>;
  /** symbol character */
  name: string;
  /** `true` if the symbol is enabled */
  disabled: boolean;
}

/**
 * Overrides MUI's default theme for chips
 *
 * The default dark theme for default color is really bad
 */
const getDarkModeTextOverrideTheme: (darkMode: boolean) => ThemeOptions = (
  darkMode
) => ({
  palette: { mode: darkMode ? "dark" : "light" },
});

/**
 * Returns chips theme value for `ThemeProvider`
 *
 * @param prefersDarkMode `true` if dark mode
 * @param activated `true` is symbol is activated
 * @returns theme value for `ThemeProvider`
 */
const useDarkModeTextOverrideTheme = (
  prefersDarkMode: boolean,
  activated: boolean
) =>
  useMemo(
    () => createTheme(getDarkModeTextOverrideTheme(prefersDarkMode)),
    [prefersDarkMode]
  );

/**
 * Chip theme enlarging touch area for touch devices
 */
const touchFriendlyChipThemeBase: ThemeOptions = {
  components: {
    MuiChip: {
      styleOverrides: {
        // base * 1.25
        root: {
          "@media not (pointer: fine)": {
            height: "40px",
            // height / 2
            borderRadius: "20px",
          },
        },
        label: {
          // base * 1.3--1.4 (1.25x look too narrow)
          "@media not (pointer: fine)": {
            paddingRight: "16px",
            paddingLeft: "16px",
          },
        },
      },
    },
  },
};

const useTouchFriendlyChipTheme = (
  prefersDarkMode: boolean,
  monoFont?: boolean | undefined
) =>
  useMemo(
    () =>
      createTheme({
        ...(monoFont ? { typography: { fontFamily: monoFontFamily } } : {}),
        palette: {
          mode: prefersDarkMode ? "dark" : "light",
        },
        ...touchFriendlyChipThemeBase,
      }),
    [prefersDarkMode, monoFont]
  );

interface ActivateChipProps {
  /** `true`if state is enabled (on) */
  activated: boolean;
  /** executed when chip is pressed */
  onClick: () => void;
  /** Label value */
  name: string;
  /** `true` if this chip is disabled (should be unavailable) */
  disabled?: boolean | undefined;
}

/**
 * Chip that retains a on/off state and toggles it when pressed
 */
const ActivateChip: FC<ActivateChipProps> = (props) => {
  return (
    <Chip
      label={props.name}
      color={props.activated ? "primary" : "default"}
      disabled={props.disabled}
      onClick={props.onClick}
    />
  );
};

/**
 * Chip for symbol enabled/disabledness
 */
const SymbolActivateChip: FC<SymbolActivateChipProps> = (props) => {
  const [activated, setActivated] = useAtom(props.activatedAtom);

  return (
    <ActivateChip
      name={props.name}
      activated={activated}
      disabled={props.disabled}
      onClick={useCallback(() => {
        setActivated(!activated);
      }, [activated, setActivated])}
    />
  );
};

interface SymbolActivateChipListProps {
  /** `true` if chip is disabled (unavailable) */
  disabled?: boolean | undefined;
}

/**
 * Chips list for all symbols
 */
const SymbolActivateChipList: FC<SymbolActivateChipListProps> = (props) => {
  const prefersDarkMode = usePrefersDarkMode();
  const touchFriendlyChipTheme = useTouchFriendlyChipTheme(
    prefersDarkMode,
    true
  );

  return (
    <div className={flexChipContainerClass}>
      <ThemeProvider theme={touchFriendlyChipTheme}>
        {allSymbolsArray.map((symbol) => (
          <SymbolActivateChip
            name={symbol}
            key={symbol}
            disabled={props.disabled ?? false}
            activatedAtom={focusAtom(enabledSymbolsAtom, (symbols) =>
              symbols.prop(symbol)
            )}
          />
        ))}
      </ThemeProvider>
    </div>
  );
};

interface KeyTopProps {
  /** key name (character or string of the key top) */
  name: string;
}

/** Simulates key top appearance */
const KeyTop: FC<KeyTopProps> = ({ name }) => {
  return (
    <div className={keyTopWrapperClass}>
      <kbd className={keyTopClass}>{name}</kbd>
    </div>
  );
};

interface SymbolFromKeyboardDialogProps {
  /** `true` if dialog is open */
  open: boolean;
  /** Executed when dialog is closed */
  onClose: () => void;
}

/**
 * Dialog that toggles symbols' enabledness from keyboard
 */
const SymbolFromKeyboardDialog: FC<SymbolFromKeyboardDialogProps> = (props) => {
  const [usableSymbols, setUsableSymbols] = useAtom(enabledSymbolsAtom);
  const [isFirefox, setIsFirefox] = useState(false);

  useEffect(() => {
    if (
      /^(?=.*Gecko\/)(?=.*Firefox\/)(?!.*like Gecko).*$/.test(
        navigator.userAgent
      )
    ) {
      setIsFirefox(true);
    }
  }, []);
  const { t } = useTranslation();

  /**
   * Handles keyboard shortcuts
   */
  const handleKeyDown = useCallback<KeyboardEventHandler<HTMLDivElement>>(
    (e) => {
      // Non-letter keys
      if (e.key.length !== 1 || e.nativeEvent.isComposing) return;
      // All
      if (e.key.toLowerCase() === "a") {
        setUsableSymbols(
          Object.fromEntries(
            Object.keys(usableSymbols).map((key) => [key, true])
          )
        );
        return;
      }
      // Empty
      if (e.key.toLowerCase() === "e") {
        setUsableSymbols(
          Object.fromEntries(
            Object.keys(usableSymbols).map((key) => [key, false])
          )
        );
        return;
      }
      if (usableSymbols[e.key] === undefined) return;
      const newList = { ...usableSymbols };
      newList[e.key] = !newList[e.key];
      setUsableSymbols(newList);
    },
    [setUsableSymbols, usableSymbols]
  );
  return (
    <Dialog open={props.open} onClose={props.onClose} onKeyDown={handleKeyDown}>
      <DialogTitle>{t("config_from_kb")}</DialogTitle>
      <DialogContent>
        <Stack spacing={1}>
          <SymbolActivateChipList />
          <p>
            <dl className={oneLineDescriptionListClass}>
              <dt>
                <KeyTop name={t("config_from_kb_dialog.symbol")} />
              </dt>
              <dd>{t("config_from_kb_dialog.toggle_pressed_symbol")}</dd>
              <dt>
                <KeyTop name="A" /> / <KeyTop name="a" />
              </dt>
              <dd>{t("config_from_kb_dialog.turn_all_on")}</dd>
              <dt>
                <KeyTop name="E" /> / <KeyTop name="e" />
              </dt>
              <dd>{t("config_from_kb_dialog.turn_all_off")}</dd>
              <dt>
                <KeyTop name="Tab" />
              </dt>
              <dd>{t("config_from_kb_dialog.next_symbol")}</dd>
              <dt>
                <KeyTop name="Shift" /> + <KeyTop name="Tab" />
              </dt>
              <dd>{t("config_from_kb_dialog.previous_symbol")}</dd>
              <dt>
                <KeyTop name="Enter" /> / <KeyTop name="Space" />
              </dt>
              <dd>{t("config_from_kb_dialog.toggle_selected_symbol")}</dd>
              <dt>
                <KeyTop name="Esc" />
              </dt>
              <dd>{t("config_from_kb_dialog.close")}</dd>
            </dl>
          </p>
          {isFirefox && <p>⚠️{t("firefox_change_settings")}</p>}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Component group to change enabledness of symbols
 */
const SymbolListChanger: FC = () => {
  const { t } = useTranslation();
  const isTypeEnabled = useAtomValue(characterTypeEnabledAtom);
  const setUsableSymbols = useSetAtom(enabledSymbolsAtom);
  const [fromKeyboardDialogOpen, setFromKeyboardDialogOpen] = useState(false);

  return (
    <section>
      <h3>{t("appearing_symbols")}</h3>
      <Stack spacing={2}>
        <SymbolActivateChipList disabled={!isTypeEnabled.symbol} />
        <div>
          <Button
            variant="contained"
            startIcon={<ToggleOffIcon />}
            disabled={!isTypeEnabled.symbol}
            onClick={() => setUsableSymbols(allDisabledSymbolsState)}
          >
            {t("turn_all_off")}
          </Button>
          <Button
            variant="contained"
            startIcon={<ToggleOnIcon />}
            disabled={!isTypeEnabled.symbol}
            onClick={() => setUsableSymbols(allEnabledSymbolsState)}
          >
            {t("turn_all_on")}
          </Button>
          <Button
            variant="contained"
            startIcon={<KeyboardIcon />}
            disabled={!isTypeEnabled.symbol}
            onClick={() => setFromKeyboardDialogOpen(true)}
          >
            {t("config_from_kb")}
          </Button>
        </div>
      </Stack>
      <SymbolFromKeyboardDialog
        open={fromKeyboardDialogOpen}
        onClose={() => setFromKeyboardDialogOpen(false)}
      />
    </section>
  );
};

/** Jotai atom for password length */
const passwordLengthAtom = atom(16);
/** Preset array for password length */
const passwordLengthPresetsArray = [
  8, 16, 24, 32, 48, 64, 72, 80, 96, 128,
] as const;

/** COmponent to change password length
 *
 * Consists of slider, input, and preset chips.
 */
const PasswordLengthChanger: FC = () => {
  const { t } = useTranslation();
  const [passwordLength, setPasswordLength] = useAtom(passwordLengthAtom);
  const setPasswordLengthFuncList = useMemo(
    () =>
      Object.fromEntries(
        passwordLengthPresetsArray.map((len) => [
          len,
          () => setPasswordLength(len),
        ])
      ),
    [setPasswordLength]
  );
  const prefersDarkMode = usePrefersDarkMode();
  const touchFriendlyChipTheme = useTouchFriendlyChipTheme(prefersDarkMode);

  return (
    <section>
      <h3>{t("pass_len")}</h3>
      <Stack spacing={2}>
        <SliderTextFieldPair
          default={16}
          max={128}
          min={8}
          inputMax={1024}
          valueAtom={passwordLengthAtom}
        />

        <div className={flexChipContainerClass}>
          <ThemeProvider theme={touchFriendlyChipTheme}>
            {passwordLengthPresetsArray.map((val) => (
              <ActivateChip
                name={val.toString()}
                key={val}
                onClick={setPasswordLengthFuncList[val]}
                activated={val === passwordLength}
              />
            ))}
          </ThemeProvider>
        </div>
      </Stack>
    </section>
  );
};

/** Keys of tables of Alphabets and digits to use */
const alNumTableKeyCandidates = AlNumTableFactory.labelsForVList;

/**
 * Jotai atom for global state of Alphabets and digits table to use
 */
const alNumTableKeyAtom = atom<AlNumTableFactoryType>("allowAll");

/**
 * Component group to change set of alphabet and numeric characters to be used
 */
const AlnumTableSetting: FC = () => {
  const [alNumTableKey, setAlNumTableKey] = useAtom(alNumTableKeyAtom);
  const { t } = useTranslation();
  /** Array of characters not to be used */
  const excludedChars = useMemo(() => {
    const table = AlNumTableFactory.list[alNumTableKey]();
    return [...FullAlNumTable.charSet].filter((ch) => !table.charSet.has(ch));
  }, [alNumTableKey]);

  return (
    <Stack spacing={2}>
      <FormControl fullWidth>
        <InputLabel id="alnumTableLabel">{t("restriction_alnum")}</InputLabel>
        <Select
          label={t("restriction_alnum")}
          labelId="alnumTableLabel"
          value={alNumTableKey}
          onChange={(e) =>
            setAlNumTableKey(e.target.value as AlNumTableFactoryType)
          }
        >
          {alNumTableKeyCandidates.map((candidate) => (
            <MenuItem value={candidate} key={candidate}>
              {t(`restriction_alnum_policies.${candidate}`)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <div>
        <span>{t("exclude_chars")}</span>
        {excludedChars.length
          ? excludedChars.flatMap((ch, i) => [
              ...(i !== 0 ? [", "] : []),
              <code key={ch} className={monoFontClass}>
                {ch}
              </code>,
            ])
          : t("nothing")}
      </div>
    </Stack>
  );
};

/**
 * Candidate list of the number of passwords to be generated
 */
const passwordCountCandidates = [1, 5, 10, 20, 50, 100] as const;

/**
 * Jotai atom for current number of passwords to be generated
 */
const passwordCountAtom = atom<keyof typeof passwordCountCandidates>(10);

/**
 * Jotai atom for allowed max character consecution
 */
const allowedMaxConsecutiveCharsCountAtom =
  atom<passwordCharsConsecutionPoliciesType>("allowAll");

/**
 * Other than character types and password length
 */
const MiscSettings: FC = () => {
  const [passwordCount, setPasswordCount] = useAtom(passwordCountAtom);
  const [maxConsecutiveCharsCount, setMaxConsecutiveCharsCount] = useAtom(
    allowedMaxConsecutiveCharsCountAtom
  );
  const { t } = useTranslation();

  return (
    <section>
      <h3>{t("misc_settings")}</h3>
      <Grid container component="section" spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel id="passwordCountLabel">{t("pass_gen_num")}</InputLabel>
            <Select
              label={t("pass_gen_num")}
              labelId="passwordCountLabel"
              value={passwordCount}
              onChange={(e) =>
                setPasswordCount(
                  e.target.value as keyof typeof passwordCountCandidates
                )
              }
            >
              {passwordCountCandidates.map((candidate) => (
                <MenuItem value={candidate} key={candidate}>
                  {candidate}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel id="consecutionPolicyLabel">
              {t("restriction_consecutive_chars")}
            </InputLabel>
            <Select
              label={t("restriction_consecutive_chars")}
              labelId="consecutionPolicyLabel"
              value={maxConsecutiveCharsCount}
              onChange={(e) =>
                setMaxConsecutiveCharsCount(
                  e.target.value as typeof maxConsecutiveCharsCount
                )
              }
            >
              {passwordCharsConsecutionPolicies.map((candidate) => (
                <MenuItem value={candidate} key={candidate}>
                  {t(`restriction_consecutive_chars_policies.${candidate}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <AlnumTableSetting />
        </Grid>
      </Grid>
    </section>
  );
};

/**
 * Button to generate passwords based on settings
 *
 * Also aggregates settings (global state atoms) and passes them to generator.
 */
export const GenerateButton: FC = () => {
  const { t } = useTranslation();
  const [isBusy, setBusiness] = useState(false);
  const passwordLength = useAtomValue(passwordLengthAtom);
  const frequency = useAtomValue(frequencyAtom);
  const isTypeEnabled = useAtomValue(characterTypeEnabledAtom);
  const usableSymbols = useAtomValue(enabledSymbolsAtom);
  const passwordCount = useAtomValue(passwordCountAtom);
  const setPasswordList = useSetAtom(generatedPasswordListAtom);
  const maxConsecutiveCharsCountTag = useAtomValue(
    allowedMaxConsecutiveCharsCountAtom
  );
  const alNumTableKey = useAtomValue(alNumTableKeyAtom);

  /**
   * Generates passwords and stores them to atom for list
   */
  const generatePassword = useCallback(async () => {
    setBusiness(true);
    /**
     * Hash table to reduce the order of detecting duplicates
     *
     * This keeps the insertion order.
     * https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Set
     */
    const passwordsSet: Set<string> = new Set();

    /**
     * String consisting of symbol characters to be used
     */
    const symbolsListArray = Object.entries(usableSymbols)
      .filter(([_, on]) => on)
      .map(([char, _]) => char)
      .join("");

    const alNumTable = AlNumTableFactory.list[alNumTableKey]();
    const maxConsecutiveCharsCount = passwordCharsConsecutionPolicies.indexOf(
      maxConsecutiveCharsCountTag
    );

    const passwordGenerator = generatePasswordGeneratorInstance(
      {
        passwordLength: passwordLength,
        usesUppers: isTypeEnabled.upper,
        usesNumbers: isTypeEnabled.digit,
        usesSymbols: isTypeEnabled.symbol,
        weightAlphas:
          (alNumTable.lowers.length +
            (isTypeEnabled.upper ? alNumTable.uppers.length : 0)) *
          frequency.alpha,
        weightNumbers: alNumTable.numbers.length * frequency.digit,
        weightSymbols: symbolsListArray.length * frequency.symbol,
        usingSymbolsList: symbolsListArray,
        alNumTable,
      },
      maxConsecutiveCharsCount
    );

    while (passwordsSet.size < (passwordCount as number)) {
      // Automatically deduplicated by built-in feature in Set
      passwordsSet.add(await passwordGenerator.generateOne());
    }
    setPasswordList([...passwordsSet]);
    setBusiness(false);
  }, [
    alNumTableKey,
    frequency,
    isTypeEnabled,
    maxConsecutiveCharsCountTag,
    passwordCount,
    passwordLength,
    setPasswordList,
    usableSymbols,
  ]);

  return (
    <>
      <Button
        variant="contained"
        startIcon={<KeyIcon />}
        onClick={generatePassword}
        sx={{ mt: 4 }}
      >
        {t("generate")}
      </Button>
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme: any) => theme.zIndex.drawer + 1 }}
        open={isBusy}
      >
        <Stack spacing={1} alignItems="center">
          <CircularProgress color="inherit" />
          <p>{t("generating")}</p>
        </Stack>
      </Backdrop>
    </>
  );
};

/**
 * Component group of overall password generation (generator) settings
 */
export const GeneratorSettings: FC = () => {
  const { t } = useTranslation();
  return (
    <Card component="section">
      <CardContent>
        <h2>{t("settings")}</h2>
        <LanguageSwitcher />
        <FrequencyChanger />
        <CharacterTypeDisabler />
        <SymbolListChanger />
        <PasswordLengthChanger />
        <MiscSettings />
        <GenerateButton />
      </CardContent>
    </Card>
  );
};
