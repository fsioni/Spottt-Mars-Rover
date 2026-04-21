import { createRootRoute, HeadContent, Outlet } from "@tanstack/react-router";

import { ThemeProvider } from "@/components/theme-provider";

import "../index.css";

export const Route = createRootRoute({
	component: RootComponent,
	head: () => ({
		meta: [
			{ title: "Mars Rover" },
			{
				name: "description",
				content: "Simulateur de rover martien avec replay temporel",
			},
		],
		links: [{ rel: "icon", href: "/favicon.ico" }],
	}),
});

function RootComponent() {
	return (
		<>
			<HeadContent />
			<ThemeProvider
				attribute="class"
				defaultTheme="dark"
				disableTransitionOnChange
				storageKey="vite-ui-theme"
			>
				<div className="h-svh w-svw">
					<Outlet />
				</div>
			</ThemeProvider>
		</>
	);
}
