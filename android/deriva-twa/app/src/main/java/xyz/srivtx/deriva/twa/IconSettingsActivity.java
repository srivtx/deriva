package xyz.srivtx.deriva.twa;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public class IconSettingsActivity extends Activity {
    private static final String PREFS = "deriva-icon-settings";
    private static final String SELECTED = "selected-alias";
    private static final int PAPER = Color.rgb(250, 249, 246);
    private static final int INK = Color.rgb(26, 29, 33);
    private static final int INK_SOFT = Color.rgb(92, 100, 112);
    private static final int GREEN = Color.rgb(47, 143, 91);

    private static final IconChoice[] CHOICES = {
            new IconChoice("Default / Deriva blue", "xyz.srivtx.deriva.twa.LauncherAlias", 0xff2e5aac),
            new IconChoice("Moss / green", "xyz.srivtx.deriva.twa.LauncherMossAlias", 0xff2f8f5b),
            new IconChoice("Ember / warm", "xyz.srivtx.deriva.twa.LauncherEmberAlias", 0xffb55335),
            new IconChoice("Violet / night", "xyz.srivtx.deriva.twa.LauncherVioletAlias", 0xff7655b8),
    };

    private SharedPreferences preferences;
    private TextView status;
    private final Button[] optionButtons = new Button[CHOICES.length];

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        preferences = getSharedPreferences(PREFS, Context.MODE_PRIVATE);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(24), dp(28), dp(24), dp(24));
        root.setBackgroundColor(PAPER);

        TextView eyebrow = text("DERIVA / APP ICON", 11, GREEN);
        eyebrow.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        root.addView(eyebrow, wrap());

        TextView title = text("Choose your launcher icon.", 28, INK);
        title.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        LinearLayout.LayoutParams titleParams = wrap();
        titleParams.topMargin = dp(10);
        root.addView(title, titleParams);

        TextView description = text("This changes the icon shown on your Android home screen. The app stays the same.", 15, INK_SOFT);
        description.setLineSpacing(0, 1.2f);
        LinearLayout.LayoutParams descriptionParams = wrap();
        descriptionParams.topMargin = dp(8);
        root.addView(description, descriptionParams);

        status = text("", 12, GREEN);
        LinearLayout.LayoutParams statusParams = wrap();
        statusParams.topMargin = dp(20);
        root.addView(status, statusParams);

        String selected = preferences.getString(SELECTED, CHOICES[0].alias);
        for (int i = 0; i < CHOICES.length; i++) {
            IconChoice choice = CHOICES[i];
            Button button = button(choice);
            button.setOnClickListener(view -> activate(choice));
            optionButtons[i] = button;
            LinearLayout.LayoutParams buttonParams = new LinearLayout.LayoutParams(-1, dp(52));
            buttonParams.topMargin = dp(10);
            root.addView(button, buttonParams);
        }

        TextView note = text("The new icon may take a moment to appear in the launcher. Return to Deriva with the back button.", 11, INK_SOFT);
        note.setLineSpacing(0, 1.25f);
        LinearLayout.LayoutParams noteParams = wrap();
        noteParams.topMargin = dp(20);
        root.addView(note, noteParams);

        setContentView(root);
        activateSelected(selected);
    }

    private void activate(IconChoice choice) {
        activateSelected(choice.alias);
        updateButtonLabels(choice.alias);
        status.setText("Launcher icon updated: " + choice.label);
    }

    private void activateSelected(String selected) {
        PackageManager packageManager = getPackageManager();
        for (IconChoice choice : CHOICES) {
            int state = choice.alias.equals(selected)
                    ? PackageManager.COMPONENT_ENABLED_STATE_ENABLED
                    : PackageManager.COMPONENT_ENABLED_STATE_DISABLED;
            packageManager.setComponentEnabledSetting(
                    new ComponentName(this, choice.alias), state, PackageManager.DONT_KILL_APP);
        }
        preferences.edit().putString(SELECTED, selected).apply();
        updateButtonLabels(selected);
    }

    private void updateButtonLabels(String selected) {
        for (int i = 0; i < CHOICES.length; i++) {
            optionButtons[i].setText(CHOICES[i].alias.equals(selected)
                    ? "Selected  /  " + CHOICES[i].label
                    : CHOICES[i].label);
        }
    }

    private Button button(IconChoice choice) {
        Button button = new Button(this);
        button.setAllCaps(false);
        button.setGravity(Gravity.CENTER_VERTICAL | Gravity.LEFT);
        button.setPadding(dp(16), 0, dp(16), 0);
        button.setText(choice.label);
        button.setTextColor(INK);
        GradientDrawable background = new GradientDrawable();
        background.setColor(Color.WHITE);
        background.setStroke(dp(1), choice.color);
        background.setCornerRadius(dp(12));
        button.setBackground(background);
        return button;
    }

    private TextView text(String value, int size, int color) {
        TextView view = new TextView(this);
        view.setText(value);
        view.setTextSize(size);
        view.setTextColor(color);
        return view;
    }

    private LinearLayout.LayoutParams wrap() {
        return new LinearLayout.LayoutParams(-1, -2);
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private static class IconChoice {
        final String label;
        final String alias;
        final int color;

        IconChoice(String label, String alias, int color) {
            this.label = label;
            this.alias = alias;
            this.color = color;
        }
    }
}
