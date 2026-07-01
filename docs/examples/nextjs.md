# Next.js

Always use `'use client'`. Create the instance outside the
component to avoid re-instantiation on every render.

```tsx
'use client'

import { useEffect } from 'react'
import { Tabus } from 'tabus-js'

type AppEvents = {
  logout: { userId: number }
}

const bus = new Tabus<AppEvents>('my-app')

export function LogoutButton() {
  useEffect(() => {
    const handler = () => redirectToLogin()
    bus.on('logout', handler)
    return () => bus.off('logout', handler)
  }, [])

  return (
    <button onClick={() => bus.emit('logout', { userId: 42 })}>
      Logout
    </button>
  )
}
```
