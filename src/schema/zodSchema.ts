import { z } from "zod";

export const schema = z.object({
  description: z.string(),
  employeeInputs: z.object({
    grossSalaryMonthlyEUR: z.coerce
      .number()
      .positive("Gross salary is required and must be > 0"),
    accountingPeriod: z.enum(["Monthly", "Yearly"]),
    taxYearSelection: z.string().nonempty(),
    employeeAge: z.coerce.number().min(16, "Age must be >= 16"),
    annualTaxAllowanceEUR: z.coerce.number().min(0),
    monetaryBenefitsMonthlyEUR: z.coerce.number().min(0),
  }),
  familyAndTaxStatus: z.object({
    maritalStatusDetails: z.object({
      status: z.enum(["Unmarried", "Married", "Divorced", "Widowed"]),
      taxClass: z.enum(["I", "II", "III", "IV", "V", "VI"]),
      isSoleWageEarner: z.boolean().optional(),
      isDualWageEarner: z.boolean().optional(),
      widowedSpouseDeathYear: z
        .union([z.coerce.number().int().optional(), z.null()])
        .nullable()
        .optional(),
    }),
    spouseTaxClass: z.union([
      z.enum(["III", "IV", "V"]),
      z.null(),
      z.string().optional(),
    ]),
    hasChildren: z.boolean(),
    childrenU25Count: z.coerce.number().min(0).max(6),
    childAllowanceFactor: z.coerce.number().min(0).max(6),
  }),
  insuranceAndSurcharges: z
    .object({
      state: z.string().nonempty(),
      churchTaxLiability: z.object({
        isLiable: z.boolean(),
      }),
      healthInsurance: z.object({
        type: z.enum([
          "CompulsoryStatutory",
          "PrivatelyInsured",
          "VoluntarilyInsuredByLaw",
        ]),
        statutoryDetails: z.object({
          additionalContributionName: z.string().optional(),
          additionalContributionRatePercent: z.coerce
            .number()
            .min(0)
            .optional(),
        }),
        privateDetails: z.object({
          monthlyPremiumEUR: z.coerce.number().min(0).optional(),
          employerParticipation: z.boolean().optional(),
        }),
        voluntaryDetails: z.object({
          // spelled per your schema ("voluntaryDetails")
          additionalContributionName: z.string().optional(),
          additionalContributionRatePercent: z.coerce
            .number()
            .min(0)
            .optional(),
        }),
      }),
      pensionScheme: z.enum([
        "NotCompulsorilyInsured",
        "CompulsoryStatutoryInsurance",
        "OnlyEmployerCompulsoryShare",
        "OnlyEmployeeCompulsoryShare",
      ]),
      unemploymentInsurance: z.enum([
        "NotCompulsorilyInsured",
        "CompulsoryStatutoryInsurance",
        "OnlyEmployerCompulsoryShare",
        "OnlyEmployeeCompulsoryShare",
      ]),
      occupationalPensionMonthlyEUR: z.coerce.number().min(0).optional(),
      surcharges: z.object({
        U1_rate_percent: z.coerce.number().min(0).optional(),
        U2_rate_percent: z.coerce.number().min(0).optional(),
      }),
      bgContributionRatePercent: z.coerce.number().min(0).optional(),
    })
    .superRefine((val, ctx) => {
      // Additional runtime checks: if churchTaxLiability.isLiable true, nothing to require here because your schema only stores isLiable.
      // If healthInsurance.type === 'PrivatelyInsured' ensure privateDetails.monthlyPremiumEUR exists (basic check)
      if (val.healthInsurance?.type === "PrivatelyInsured") {
        const mp = val.healthInsurance.privateDetails?.monthlyPremiumEUR;
        if (mp === undefined || Number.isNaN(mp)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "Private monthly premium is required for PrivatelyInsured type",
            path: ["healthInsurance", "privateDetails", "monthlyPremiumEUR"],
          });
        }
      }
    }),
});
