# Graph Report - .  (2026-08-03)

## Corpus Check
- Corpus is ~43,890 words - fits in a single context window. You may not need a graph.

## Summary
- 868 nodes · 2022 edges · 94 communities (40 shown, 54 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Config Admin y Portal Tienda
- Autenticación y Sesión
- Ventas Clientes y Compras
- Diálogos y Menús UI
- Toasts y Notificaciones
- Config TypeScript
- Sidebar y Dropdowns
- Build y Dependencias
- Inputs y Feedback UI
- Servicio Admin Dashboard
- Inventario y Productos
- Sidebar Core y Tooltip
- Button Group y Fields
- Servicio Clientes
- Config shadcn/ui
- Menú Contextual
- Carrusel UI
- Item List UI
- Utilidades UI
- Sheet UI
- Formularios RHF
- Gráficas Recharts
- Drawer UI
- Servicio Ventas
- Navigation Menu
- Layout Raíz y Temas
- Header Portal Cliente
- Paginación UI
- Dashboard Content
- Empty State UI
- Responsividad Sidebar
- Página Dashboard
- Toggle Group
- Brand Assets
- Acordeón UI
- Alertas UI
- Input OTP
- Popover UI
- Hover Card
- Iconos App
- Calendario UI
- Proxy Dev
- Favicons
- Autoprefixer
- CVA
- clsx
- cmdk
- React DOM
- Resolvers
- Input OTP pkg
- React pkg
- Next pkg
- Next Config
- Chart d5
- Radix Accordion
- Radix Dialog
- Radix Ratio
- Radix Avatar
- Radix Checkbox
- Radix Menu
- Radix Dialog pkg
- Radix Dropdown
- Radix Card
- Radix Label
- Radix Menubar
- Radix Popover
- Radix Group
- Scroll Area
- Radix Select
- Radix Separator
- Radix Slider
- Radix Slot
- Radix Switch
- Radix Tabs
- Radix Toast
- Radix Toggle
- Radix Tooltip
- Day Picker
- React DOM pkg
- React Hook Form
- Panels UI
- Recharts pkg
- Sonner pkg
- tailwind-merge
- Vaul pkg
- Vercel Analytics
- Zod
- pnpm Workspace
- Tailwind Config
- Ícono 32x32
- Placeholder Usuario
- Placeholder Logo

## God Nodes (most connected - your core abstractions)
1. `cn()` - 275 edges
2. `fetchClient()` - 54 edges
3. `getStoredUser()` - 41 edges
4. `react` - 21 edges
5. `Button()` - 20 edges
6. `saveAuthSession()` - 16 edges
7. `compilerOptions` - 16 edges
8. `Separator()` - 14 edges
9. `Card()` - 13 edges
10. `CardContent()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `AccordionItem()` --calls--> `cn()`  [EXTRACTED]
  components/ui/accordion.tsx → lib/utils.ts
- `AccordionTrigger()` --calls--> `cn()`  [EXTRACTED]
  components/ui/accordion.tsx → lib/utils.ts
- `AccordionContent()` --calls--> `cn()`  [EXTRACTED]
  components/ui/accordion.tsx → lib/utils.ts
- `AlertTitle()` --calls--> `cn()`  [EXTRACTED]
  components/ui/alert.tsx → lib/utils.ts
- `AlertDescription()` --calls--> `cn()`  [EXTRACTED]
  components/ui/alert.tsx → lib/utils.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **allowBuilds Configuration** — pnpm_workspace_workspace, pnpm_workspace_sharp [EXTRACTED 1.00]
- **Icon glyph forms the site icon** — public_icon_brand_logo, public_icon_site_icon [INFERRED 0.75]
- **App Icon Asset Set** — public_apple_icon_png_apple_icon, public_icon_svg_icon, public_icon_dark_32x32_png_icon_dark, public_icon_light_32x32_png_icon_light [INFERRED 0.75]

## Communities (94 total, 54 thin omitted)

### Community 0 - "Config Admin y Portal Tienda"
Cohesion: 0.07
Nodes (65): UserProfile, PRODUCT_CATEGORIES, StorePreviewPayload, IMPORTANT: deps vacío — solo corre al montar, no en cada cambio de router., Role, StoreProduct, TiendaPageContent(), StatCardProps (+57 more)

### Community 1 - "Autenticación y Sesión"
Cohesion: 0.06
Nodes (63): GoogleCallbackPage(), LoginPage(), GoogleCallbackClient(), parseJwtPayload(), AppSidebar(), ACTIVITY_EVENTS, SessionProvider(), Notification (+55 more)

### Community 2 - "Ventas Clientes y Compras"
Cohesion: 0.07
Nodes (42): Customer, ComprasPage(), fmtDate(), fmtMoney(), getStatusCfg(), groupBySale(), parseDate(), SaleGroup (+34 more)

### Community 3 - "Diálogos y Menús UI"
Cohesion: 0.07
Nodes (33): AlertDialogOverlay(), CardAction(), Command(), CommandDialog(), CommandGroup(), CommandInput(), CommandItem(), CommandList() (+25 more)

### Community 4 - "Toasts y Notificaciones"
Cohesion: 0.08
Nodes (38): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+30 more)

### Community 5 - "Config TypeScript"
Cohesion: 0.07
Nodes (27): dom, dom.iterable, esnext, .next\\dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+19 more)

### Community 6 - "Sidebar y Dropdowns"
Cohesion: 0.09
Nodes (21): navItems, DropdownMenu(), DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuRadioItem(), DropdownMenuSeparator() (+13 more)

### Community 7 - "Build y Dependencias"
Cohesion: 0.08
Nodes (25): devDependencies, postcss, tailwindcss, @tailwindcss/postcss, tw-animate-css, @types/node, @types/react, @types/react-dom (+17 more)

### Community 8 - "Inputs y Feedback UI"
Cohesion: 0.10
Nodes (15): Checkbox(), InputGroup(), InputGroupAddon(), inputGroupAddonVariants, InputGroupButton(), inputGroupButtonVariants, InputGroupInput(), InputGroupText() (+7 more)

### Community 9 - "Servicio Admin Dashboard"
Cohesion: 0.10
Nodes (20): ConfiguracionPage(), AdminProfile, DashboardDataResponse, DashboardMonthlyData, DashboardShowLatestSales, fetchAdminProfile(), fetchDashboardClientCount(), fetchDashboardGraphic() (+12 more)

### Community 10 - "Inventario y Productos"
Cohesion: 0.17
Nodes (22): InventarioPage(), CartSheet(), API_BASE_URL, buildUrl(), fetchClient(), fetchJson(), deactivateProduct(), deleteProduct() (+14 more)

### Community 11 - "Sidebar Core y Tooltip"
Cohesion: 0.14
Nodes (18): Sidebar(), SidebarContext, SidebarContextProps, SidebarGroupAction(), SidebarInput(), SidebarMenuAction(), SidebarMenuBadge(), SidebarMenuButton() (+10 more)

### Community 12 - "Button Group y Fields"
Cohesion: 0.13
Nodes (16): ButtonGroup(), ButtonGroupSeparator(), ButtonGroupText(), buttonGroupVariants, Field(), FieldContent(), FieldDescription(), FieldError() (+8 more)

### Community 13 - "Servicio Clientes"
Cohesion: 0.14
Nodes (16): ConfiguracionClientePage(), ClientProfile, ClientsSummaryView, ClientUpdatePayload, fetchClientHistory(), fetchClientProfile(), fetchClientsSummary(), fetchClientsSummaryByEmail() (+8 more)

### Community 14 - "Config shadcn/ui"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 15 - "Menú Contextual"
Cohesion: 0.12
Nodes (9): ContextMenuCheckboxItem(), ContextMenuContent(), ContextMenuItem(), ContextMenuLabel(), ContextMenuRadioItem(), ContextMenuSeparator(), ContextMenuShortcut(), ContextMenuSubContent() (+1 more)

### Community 16 - "Carrusel UI"
Cohesion: 0.20
Nodes (13): Carousel(), CarouselApi, CarouselContent(), CarouselContext, CarouselContextProps, CarouselItem(), CarouselNext(), CarouselOptions (+5 more)

### Community 17 - "Item List UI"
Cohesion: 0.18
Nodes (12): Item(), ItemActions(), ItemContent(), ItemDescription(), ItemFooter(), ItemGroup(), ItemHeader(), ItemMedia() (+4 more)

### Community 18 - "Utilidades UI"
Cohesion: 0.15
Nodes (13): date-fns, next-themes, dependencies, date-fns, next-themes, @radix-ui/react-collapsible, @radix-ui/react-navigation-menu, @radix-ui/react-progress (+5 more)

### Community 19 - "Sheet UI"
Cohesion: 0.24
Nodes (7): Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetTitle()

### Community 20 - "Formularios RHF"
Cohesion: 0.23
Nodes (10): FormControl(), FormDescription(), FormFieldContext, FormFieldContextValue, FormItem(), FormItemContext, FormItemContextValue, FormLabel() (+2 more)

### Community 21 - "Gráficas Recharts"
Cohesion: 0.25
Nodes (9): ChartConfig, ChartContainer(), ChartContext, ChartContextProps, ChartLegendContent(), ChartTooltipContent(), getPayloadConfigFromPayload(), THEMES (+1 more)

### Community 22 - "Drawer UI"
Cohesion: 0.18
Nodes (6): DrawerContent(), DrawerDescription(), DrawerFooter(), DrawerHeader(), DrawerOverlay(), DrawerTitle()

### Community 23 - "Servicio Ventas"
Cohesion: 0.29
Nodes (9): VentasPage(), fetchClientPurchases(), fetchSalesItems(), fetchSalesItemsByClient(), fetchSalesItemsByProduct(), handleSalesResponse(), purchase(), PurchaseItemRequestDTO (+1 more)

### Community 24 - "Navigation Menu"
Cohesion: 0.22
Nodes (9): NavigationMenu(), NavigationMenuContent(), NavigationMenuIndicator(), NavigationMenuItem(), NavigationMenuLink(), NavigationMenuList(), NavigationMenuTrigger(), navigationMenuTriggerStyle (+1 more)

### Community 25 - "Layout Raíz y Temas"
Cohesion: 0.28
Nodes (5): _geist, _geistMono, metadata, ThemeProvider(), Toaster()

### Community 26 - "Header Portal Cliente"
Cohesion: 0.36
Nodes (5): PortalHeader(), Avatar(), AvatarFallback(), AvatarImage(), fetchClientProfilePhotoBlobUrl()

### Community 27 - "Paginación UI"
Cohesion: 0.22
Nodes (7): Pagination(), PaginationContent(), PaginationEllipsis(), PaginationLink(), PaginationLinkProps, PaginationNext(), PaginationPrevious()

### Community 28 - "Dashboard Content"
Cohesion: 0.32
Nodes (7): DashboardContent(), RevenueChart(), RevenueChartProps, StatCard(), fetchDashboardData(), fetchDashboardExcel(), RevenueDataPoint

### Community 29 - "Empty State UI"
Cohesion: 0.29
Nodes (7): Empty(), EmptyContent(), EmptyDescription(), EmptyHeader(), EmptyMedia(), emptyMediaVariants, EmptyTitle()

### Community 30 - "Responsividad Sidebar"
Cohesion: 0.29
Nodes (6): SidebarMenuSkeleton(), SidebarProvider(), useIsMobile(), useIsMobile(), react, react

### Community 31 - "Página Dashboard"
Cohesion: 0.38
Nodes (4): GoogleCallbackAdmin(), parseJwtPayload(), SidebarInset(), SidebarTrigger()

### Community 32 - "Toggle Group"
Cohesion: 0.43
Nodes (5): ToggleGroup(), ToggleGroupContext, ToggleGroupItem(), Toggle(), toggleVariants

### Community 33 - "Brand Assets"
Cohesion: 0.29
Nodes (7): Adaptive light/dark color scheme (background/foreground classes), Brand logo glyph (two interlocking geometric paths), Site icon (SVG brand logo for ApplicationBizAdmin), Geometric Brand Mark Path, Brand Placeholder Asset, Placeholder Logo Raster (PNG), PLACEHOLDER Wordmark Graphic

### Community 34 - "Acordeón UI"
Cohesion: 0.40
Nodes (3): AccordionContent(), AccordionItem(), AccordionTrigger()

### Community 35 - "Alertas UI"
Cohesion: 0.50
Nodes (4): Alert(), AlertDescription(), AlertTitle(), alertVariants

### Community 36 - "Input OTP"
Cohesion: 0.40
Nodes (3): InputOTP(), InputOTPGroup(), InputOTPSlot()

### Community 40 - "Iconos App"
Cohesion: 0.50
Nodes (4): Apple Icon (PNG), Dark Icon 32x32 (PNG), Light Icon 32x32 (PNG), Icon (SVG)

## Ambiguous Edges - Review These
- `Site icon (SVG brand logo for ApplicationBizAdmin)` → `Brand logo glyph (two interlocking geometric paths)`  [AMBIGUOUS]
  public/icon.svg · relation: semantically_similar_to

## Knowledge Gaps
- **191 isolated node(s):** `Customer`, `UserProfile`, `PRODUCT_CATEGORIES`, `StorePreviewPayload`, `_geist` (+186 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **54 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Site icon (SVG brand logo for ApplicationBizAdmin)` and `Brand logo glyph (two interlocking geometric paths)`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **Why does `cn()` connect `Diálogos y Menús UI` to `Config Admin y Portal Tienda`, `Ventas Clientes y Compras`, `Toasts y Notificaciones`, `Sidebar y Dropdowns`, `Inputs y Feedback UI`, `Sidebar Core y Tooltip`, `Button Group y Fields`, `Menú Contextual`, `Carrusel UI`, `Item List UI`, `Sheet UI`, `Formularios RHF`, `Gráficas Recharts`, `Drawer UI`, `Navigation Menu`, `Header Portal Cliente`, `Paginación UI`, `Dashboard Content`, `Empty State UI`, `Responsividad Sidebar`, `Página Dashboard`, `Toggle Group`, `Acordeón UI`, `Alertas UI`, `Input OTP`, `Popover UI`, `Hover Card`, `Calendario UI`?**
  _High betweenness centrality (0.428) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Utilidades UI` to `Build y Dependencias`, `Responsividad Sidebar`, `Autoprefixer`, `CVA`, `clsx`, `cmdk`, `React DOM`, `Resolvers`, `Input OTP pkg`, `React pkg`, `Next pkg`, `Radix Accordion`, `Radix Dialog`, `Radix Ratio`, `Radix Avatar`, `Radix Checkbox`, `Radix Menu`, `Radix Dialog pkg`, `Radix Dropdown`, `Radix Card`, `Radix Label`, `Radix Menubar`, `Radix Popover`, `Radix Group`, `Scroll Area`, `Radix Select`, `Radix Separator`, `Radix Slider`, `Radix Slot`, `Radix Switch`, `Radix Tabs`, `Radix Toast`, `Radix Toggle`, `Radix Tooltip`, `Day Picker`, `React DOM pkg`, `React Hook Form`, `Panels UI`, `Recharts pkg`, `Sonner pkg`, `tailwind-merge`, `Vaul pkg`, `Vercel Analytics`, `Zod`?**
  _High betweenness centrality (0.235) - this node is a cross-community bridge._
- **Why does `react` connect `Responsividad Sidebar` to `Config Admin y Portal Tienda`, `Toggle Group`, `Diálogos y Menús UI`, `Input OTP`, `Toasts y Notificaciones`, `Calendario UI`, `Sidebar Core y Tooltip`, `Carrusel UI`, `Utilidades UI`, `Formularios RHF`, `Gráficas Recharts`?**
  _High betweenness centrality (0.233) - this node is a cross-community bridge._
- **What connects `Customer`, `UserProfile`, `PRODUCT_CATEGORIES` to the rest of the system?**
  _191 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Config Admin y Portal Tienda` be split into smaller, more focused modules?**
  _Cohesion score 0.07252747252747253 - nodes in this community are weakly interconnected._
- **Should `Autenticación y Sesión` be split into smaller, more focused modules?**
  _Cohesion score 0.06049213943950786 - nodes in this community are weakly interconnected._