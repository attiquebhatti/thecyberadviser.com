<div className="hidden lg:flex items-center gap-1">
  {navItems.map((item) => {
    const isActive = pathname === item.href;

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'group relative px-4 py-2 text-sm font-medium transition-all duration-300',
          isActive ? 'text-amber-400' : 'text-slate-400 hover:text-amber-400'
        )}
      >
        {item.label}
        <span
          className={cn(
            'absolute inset-x-2 -bottom-px h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent transition-opacity duration-300',
            isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}
        />
      </Link>
    );
  })}
</div>
