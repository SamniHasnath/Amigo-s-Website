// Part of the PUBLIC website — keep this file. It lets the site build and run when the staff
// panel folder (src/admin) is not present, e.g. in the public repository. import.meta.glob
// returns an empty object when the file does not exist, instead of failing the build.
import type { ComponentType } from 'react';

const modules = import.meta.glob<{ default: ComponentType }>('../admin/AdminApp.tsx');

/** Loads the staff panel, or undefined when this build doesn't include it. */
export const loadAdmin = modules['../admin/AdminApp.tsx'];

/** True when the staff panel is part of this build (show the staff login links). */
export const HAS_ADMIN = Boolean(loadAdmin);
