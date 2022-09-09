
/* ———————————————————— Copyright (c) 2022 toastythetoaster ————————————————————
 *
 * ModifyProfile Plugin
 *
 * ————————————————————————————————————————————————————————————————————————————— */

import { SettingsObject, UPlugin } from '@classes';
import { UserStore, APIModule } from '@webpack';
import { after, before, unpatchAll } from '@patcher';

const settings: SettingsObject = Astra.settings.get('ModifyProfile');
const currentUserId = UserStore.getCurrentUser().id;

export default class ModifyProfile extends UPlugin {
  start(): void {
    this._patch();
  }
  stop(): void {
    unpatchAll('ModifyProfile')
  }
  _patch(): void {
    before('ModifyProfile', APIModule, 'patch', (_, args) => {
      const [options] = args;
      const { url, body } = options;
      if (url?.includes('/users/%40me/profile') && (body?.pronouns || body?.theme_colors)) {
        body?.pronouns && (settings.set('pronouns', body.pronouns));
        body?.theme_colors && (settings.set('theme_colors', body.theme_colors));
      }
    });
    after('ModifyProfile', APIModule, 'get', (_, args, ret) => {
      const [options] = args;
      const { url } = options;
      if (url.includes(`/users/${currentUserId}/profile`)) {
        return new Promise(async (resolve, reject) => {
          const res = await ret;
          if (res.ok) {
            res.body.profile_themes_experiment_bucket = 1;
            res.body.user_profile = {
              ...res.body.user_profile,
              pronouns: settings.get<string | null | undefined>('pronouns', ''),
              theme_colors: settings.get<number[] | null | undefined>('theme_colors', []),
            };
          }
          resolve(res);
        });
      }
    });
  }
}
