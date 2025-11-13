import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'var(--border)',
				input: 'var(--input)',
				ring: 'var(--ring)',
				background: 'var(--background)',
				foreground: 'var(--foreground)',
				primary: {
					DEFAULT: 'var(--primary)',
					foreground: 'var(--primary-foreground)'
				},
				secondary: {
					DEFAULT: 'var(--secondary)',
					foreground: 'var(--secondary-foreground)'
				},
				destructive: {
					DEFAULT: 'var(--destructive)',
					foreground: 'var(--destructive-foreground)'
				},
				muted: {
					DEFAULT: 'var(--muted)',
					foreground: 'var(--muted-foreground)'
				},
				accent: {
					DEFAULT: 'var(--accent)',
					foreground: 'var(--accent-foreground)'
				},
				popover: {
					DEFAULT: 'var(--popover)',
					foreground: 'var(--popover-foreground)'
				},
				card: {
					DEFAULT: 'var(--card)',
					foreground: 'var(--card-foreground)'
				},
				chart: {
					'1': 'var(--chart-1)',
					'2': 'var(--chart-2)',
					'3': 'var(--chart-3)',
					'4': 'var(--chart-4)',
					'5': 'var(--chart-5)'
				},
				sidebar: {
					DEFAULT: 'var(--sidebar)',
					foreground: 'var(--sidebar-foreground)',
					primary: 'var(--sidebar-primary)',
					'primary-foreground': 'var(--sidebar-primary-foreground)',
					accent: 'var(--sidebar-accent)',
					'accent-foreground': 'var(--sidebar-accent-foreground)',
					border: 'var(--sidebar-border)',
					ring: 'var(--sidebar-ring)'
				}
			},
			fontFamily: {
				sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
				serif: ['var(--font-serif)', 'serif'],
				mono: ['var(--font-mono)', 'monospace']
			},
			boxShadow: {
				'2xs': 'var(--shadow-2xs)',
				'xs': 'var(--shadow-xs)',
				'sm': 'var(--shadow-sm)',
				'DEFAULT': 'var(--shadow)',
				'md': 'var(--shadow-md)',
				'lg': 'var(--shadow-lg)',
				'xl': 'var(--shadow-xl)',
				'2xl': 'var(--shadow-2xl)'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'float-1': {
					'0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
					'25%': { transform: 'translateY(-20px) translateX(10px)' },
					'50%': { transform: 'translateY(-10px) translateX(-5px)' },
					'75%': { transform: 'translateY(-30px) translateX(15px)' }
				},
				'float-2': {
					'0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
					'33%': { transform: 'translateY(-15px) translateX(-10px)' },
					'66%': { transform: 'translateY(-25px) translateX(5px)' }
				},
				'float-3': {
					'0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
					'20%': { transform: 'translateY(-12px) translateX(8px)' },
					'40%': { transform: 'translateY(-8px) translateX(-12px)' },
					'60%': { transform: 'translateY(-20px) translateX(6px)' },
					'80%': { transform: 'translateY(-5px) translateX(-8px)' }
				},
				'float-4': {
					'0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
					'30%': { transform: 'translateY(-18px) translateX(-6px)' },
					'70%': { transform: 'translateY(-22px) translateX(12px)' }
				},
				'float-5': {
					'0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
					'25%': { transform: 'translateY(-8px) translateX(4px)' },
					'50%': { transform: 'translateY(-4px) translateX(-2px)' },
					'75%': { transform: 'translateY(-12px) translateX(6px)' }
				},
				'float-6': {
					'0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
					'40%': { transform: 'translateY(-10px) translateX(-3px)' },
					'80%': { transform: 'translateY(-6px) translateX(5px)' }
				},
				'float-7': {
					'0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
					'35%': { transform: 'translateY(-7px) translateX(3px)' },
					'70%': { transform: 'translateY(-14px) translateX(-4px)' }
				},
				'float-8': {
					'0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
					'50%': { transform: 'translateY(-9px) translateX(2px)' }
				},
				'float-9': {
					'0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
					'50%': { transform: 'translateY(-5px) translateX(1px)' }
				},
				'float-10': {
					'0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
					'60%': { transform: 'translateY(-6px) translateX(-1px)' }
				},
				'float-11': {
					'0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
					'45%': { transform: 'translateY(-4px) translateX(2px)' }
				},
				'float-12': {
					'0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
					'55%': { transform: 'translateY(-7px) translateX(-2px)' }
				},
				'pulse-slow': {
					'0%, 100%': { opacity: '0.3' },
					'50%': { opacity: '0.8' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'float-1': 'float-1 8s ease-in-out infinite',
				'float-2': 'float-2 6s ease-in-out infinite',
				'float-3': 'float-3 10s ease-in-out infinite',
				'float-4': 'float-4 7s ease-in-out infinite',
				'float-5': 'float-5 5s ease-in-out infinite',
				'float-6': 'float-6 9s ease-in-out infinite',
				'float-7': 'float-7 6.5s ease-in-out infinite',
				'float-8': 'float-8 8.5s ease-in-out infinite',
				'float-9': 'float-9 4s ease-in-out infinite',
				'float-10': 'float-10 7.5s ease-in-out infinite',
				'float-11': 'float-11 5.5s ease-in-out infinite',
				'float-12': 'float-12 9.5s ease-in-out infinite',
				'pulse-slow': 'pulse-slow 4s ease-in-out infinite'
			}
		}
	},
	plugins: [
		require("tailwindcss-animate"),
		require("@tailwindcss/typography"),
	],
} satisfies Config;
