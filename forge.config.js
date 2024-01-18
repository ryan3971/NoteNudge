module.exports = {
	packagerConfig: {
		extraResource: ["src/assets/scripts/dist"],
		asar: true,
		icon: __dirname + "/src/assets/icons/icon",
	},
	rebuildConfig: {},
	makers: [
		{
			name: "@electron-forge/maker-squirrel",
			config: {
				// certificateFile: "./cert.pfx",
				// certificatePassword: process.env.CERTIFICATE_PASSWORD,
				// An URL to an ICO file to use as the application icon (displayed in Control Panel > Programs and Features).
				// iconUrl: "https://url/to/icon.ico",
				// The ICO file to use as the icon for the generated Setup.exe
				setupIcon: __dirname + "/src/assets/icons/icon.ico",
			},
		},
		{
			name: "@electron-forge/maker-zip",
			platforms: ["darwin"],
		},
		{
			name: "@electron-forge/maker-deb",
			config: {},
		},
		{
			name: "@electron-forge/maker-rpm",
			config: {},
		},
	],
	plugins: [
		{
			name: "@electron-forge/plugin-auto-unpack-natives",
			config: {},
		},
	],
};
