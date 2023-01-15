import { sequencedChars } from "./generator"


export default Vue.extend({
  data() {
    const availableSymbols = [...sequencedChars("!/:@[`{~")]
    return {
      uses_upper: true,
      uses_num: true,
      uses_symbol: true,
      weight_alpha: 60,
      weight_num: 60,
      weight_symbol: 60,
      passwordLength: 16,
      passwordGenerateCount: 10,
      candicatePasswordGenerateCounts: [1, 5, 10, 20, 50, 100],
      candicatePasswordLengths: [8, 16, 24, 32, 48, 64, 80, 96, 128],
      availableSymbols,
      using_symbols_list: availableSymbols,
      isSymbolConfigDialogOpened: false,
      usingSymbolListString: "",
      generatedPasswords: emptyArray<string>(),
      languageIcons: {
        en: "🌐",
        ja: "🇯🇵",
      },
      consecution: 0,
      consecutionPolicies: passwordCharsConsecutionPolicies.map(
        (label: string, index: number) => {
          return {
            value: index,
            description: $t(`restriction_consecutive_chars_policies.${label}`),
          }
        }
      ),
      alNumRestriction: 0,
      alNumRestrictionPolicies: AlNumTableFactory.labelsForVList.map(
        (label: string, index: number) => {
          return {
            value: index,
            description: $t(`restriction_alnum_policies.${label}`),
          }
        }
      ),
      isGeneratingDialogOpened: false,
    }
  },
  methods: {
    copyToClipboard(pass: string) {
      // @ts-ignore
      this.$copyText(pass)
    },
    async generatePasswords() {
      this.isGeneratingDialogOpened = true

      const passwordsArray: string[] = []
      // Hash table to reduce the order of detecting duplicates
      const passwordsSet: Set<string> = new Set()

      const passwordGenerator = generatePasswordGeneratorInstance(
        {
          passwordLength: this.passwordLength,
          usesUppers: this.uses_upper,
          usesNumbers: this.uses_num,
          usesSymbols: this.uses_symbol,
          weightAlphas: this.weight_alpha,
          weightNumbers: this.weight_num,
          weightSymbols: this.weight_symbol,
          usingSymbolsList: this.using_symbols_list.join(""),
          alNumTable: AlNumTableFactory.generate(this.alNumRestriction),
        },
        this.consecution
      )

      for (let i = 0; i < this.passwordGenerateCount; ++i) {
        let justGenerated: string
        do {
          justGenerated = await passwordGenerator.generateOne()
        } while (passwordsSet.has(justGenerated))
        passwordsArray.push(justGenerated)
        passwordsSet.add(justGenerated)
      }
      this.generatedPasswords = passwordsArray
      this.isGeneratingDialogOpened = false
    },
    unifySymbolSwitchesState(state: boolean) {
      this.using_symbols_list = state ? this.availableSymbols : []
    },
    openSymbolConfigDialog() {
      this.usingSymbolListString = ""
      this.isSymbolConfigDialogOpened = true
      // @ts-ignore
      this.$nextTick(() => this.$refs.usingSymbolListString.focus())
    },
    setSymbolSwitchesFromStr() {
      this.using_symbols_list = this.availableSymbols.filter((char) =>
        this.usingSymbolListString.includes(char)
      )
      this.isSymbolConfigDialogOpened = false
      this.usingSymbolListString = ""
    },
    },
  },
})
