package xyz.srivtx.deriva.twa;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.content.pm.PackageManager;
import android.content.pm.ShortcutInfo;
import android.content.pm.ShortcutManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.Icon;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import java.io.InputStream;

public class IconSettingsActivity extends Activity {
    private static final String PREFS = "deriva-icon-settings";
    private static final String SELECTED = "selected-alias";
    private static final int REQUEST_PICK_IMAGE = 4101;
    private static final int PAPER = Color.rgb(250, 249, 246);
    private static final int INK = Color.rgb(26, 29, 33);
    private static final int INK_SOFT = Color.rgb(92, 100, 112);
    private static final int GREEN = Color.rgb(47, 143, 91);

    private static final IconChoice[] CHOICES = {
            new IconChoice("Default / Deriva blue", "xyz.srivtx.deriva.twa.LauncherAlias", 0xff2e5aac, R.mipmap.ic_launcher),
            new IconChoice("Moss / green", "xyz.srivtx.deriva.twa.LauncherMossAlias", 0xff2f8f5b, R.drawable.icon_moss),
            new IconChoice("Ember / warm", "xyz.srivtx.deriva.twa.LauncherEmberAlias", 0xffb55335, R.drawable.icon_ember),
            new IconChoice("Violet / night", "xyz.srivtx.deriva.twa.LauncherVioletAlias", 0xff7655b8, R.drawable.icon_violet),
            new IconChoice("Cipher / deep green", "xyz.srivtx.deriva.twa.LauncherCipherAlias", 0xff123c35, R.drawable.icon_cipher),
            new IconChoice("Crypto / gold", "xyz.srivtx.deriva.twa.LauncherCryptoAlias", 0xfff1b84b, R.drawable.icon_crypto),
            new IconChoice("Orbit / electric blue", "xyz.srivtx.deriva.twa.LauncherOrbitAlias", 0xff67d2ff, R.drawable.icon_orbit),
    };

    private SharedPreferences preferences;
    private TextView status;
    private ImageView selectedPreview;
    private ImageView customPreview;
    private Button applyButton;
    private Button shortcutButton;
    private Bitmap customBitmap;
    private String appliedAlias;
    private String pendingAlias;
    private final Button[] optionButtons = new Button[CHOICES.length];

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        preferences = getSharedPreferences(PREFS, Context.MODE_PRIVATE);

        ScrollView scroll = new ScrollView(this);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(24), dp(28), dp(24), dp(24));
        root.setBackgroundColor(PAPER);
        scroll.addView(root);

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
        selectedPreview = new ImageView(this);
        selectedPreview.setImageResource(iconForAlias(selected));
        selectedPreview.setPadding(dp(12), dp(12), dp(12), dp(12));
        GradientDrawable previewBackground = new GradientDrawable();
        previewBackground.setColor(Color.WHITE);
        previewBackground.setCornerRadius(dp(20));
        previewBackground.setStroke(dp(1), GREEN);
        selectedPreview.setBackground(previewBackground);
        LinearLayout.LayoutParams previewParams = new LinearLayout.LayoutParams(dp(112), dp(112));
        previewParams.gravity = Gravity.CENTER_HORIZONTAL;
        previewParams.topMargin = dp(18);
        root.addView(selectedPreview, previewParams);

        TextView previewLabel = text("Preview", 11, INK_SOFT);
        previewLabel.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams previewLabelParams = wrap();
        previewLabelParams.topMargin = dp(7);
        root.addView(previewLabel, previewLabelParams);

        TextView choicesLabel = text("BUNDLED ICONS", 10, GREEN);
        choicesLabel.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        LinearLayout.LayoutParams choicesLabelParams = wrap();
        choicesLabelParams.topMargin = dp(24);
        root.addView(choicesLabel, choicesLabelParams);

        for (int i = 0; i < CHOICES.length; i++) {
            IconChoice choice = CHOICES[i];
            Button button = button(choice);
            button.setOnClickListener(view -> select(choice));
            optionButtons[i] = button;
            LinearLayout.LayoutParams buttonParams = new LinearLayout.LayoutParams(-1, dp(52));
            buttonParams.topMargin = dp(10);
            root.addView(button, buttonParams);
        }

        applyButton = button("Apply selected icon");
        applyButton.setOnClickListener(view -> applyIcon(pendingAlias));
        LinearLayout.LayoutParams applyParams = new LinearLayout.LayoutParams(-1, dp(52));
        applyParams.topMargin = dp(14);
        root.addView(applyButton, applyParams);

        TextView customLabel = text("YOUR IMAGE", 10, GREEN);
        customLabel.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        LinearLayout.LayoutParams customLabelParams = wrap();
        customLabelParams.topMargin = dp(28);
        root.addView(customLabel, customLabelParams);

        TextView customDescription = text("Choose an image locally. Android can add it as a home-screen shortcut; the signed APK launcher icon stays on the bundled choices above.", 12, INK_SOFT);
        customDescription.setLineSpacing(0, 1.2f);
        LinearLayout.LayoutParams customDescriptionParams = wrap();
        customDescriptionParams.topMargin = dp(7);
        root.addView(customDescription, customDescriptionParams);

        Button chooseImageButton = button("Choose image from this device");
        chooseImageButton.setOnClickListener(view -> chooseImage());
        LinearLayout.LayoutParams chooseImageParams = new LinearLayout.LayoutParams(-1, dp(52));
        chooseImageParams.topMargin = dp(10);
        root.addView(chooseImageButton, chooseImageParams);

        customPreview = new ImageView(this);
        customPreview.setVisibility(View.GONE);
        customPreview.setPadding(dp(12), dp(12), dp(12), dp(12));
        LinearLayout.LayoutParams customPreviewParams = new LinearLayout.LayoutParams(dp(112), dp(112));
        customPreviewParams.gravity = Gravity.CENTER_HORIZONTAL;
        customPreviewParams.topMargin = dp(14);
        root.addView(customPreview, customPreviewParams);

        shortcutButton = button("Add image as home-screen shortcut");
        shortcutButton.setEnabled(false);
        shortcutButton.setOnClickListener(view -> addImageShortcut());
        LinearLayout.LayoutParams shortcutParams = new LinearLayout.LayoutParams(-1, dp(52));
        shortcutParams.topMargin = dp(10);
        root.addView(shortcutButton, shortcutParams);

        TextView note = text("The new icon may take a moment to appear in the launcher. Return to Deriva with the back button.", 11, INK_SOFT);
        note.setLineSpacing(0, 1.25f);
        LinearLayout.LayoutParams noteParams = wrap();
        noteParams.topMargin = dp(20);
        root.addView(note, noteParams);

        setContentView(scroll);
        appliedAlias = selected;
        pendingAlias = selected;
        applyIcon(selected);
    }

    private void select(IconChoice choice) {
        pendingAlias = choice.alias;
        selectedPreview.setImageResource(choice.iconRes);
        updateButtonLabels(pendingAlias);
        applyButton.setEnabled(!pendingAlias.equals(appliedAlias));
        status.setText("Previewing: " + choice.label + ". Tap Apply selected icon.");
    }

    private void applyIcon(String selected) {
        PackageManager packageManager = getPackageManager();
        for (IconChoice choice : CHOICES) {
            int state = choice.alias.equals(selected)
                    ? PackageManager.COMPONENT_ENABLED_STATE_ENABLED
                    : PackageManager.COMPONENT_ENABLED_STATE_DISABLED;
            packageManager.setComponentEnabledSetting(
                    new ComponentName(this, choice.alias), state, PackageManager.DONT_KILL_APP);
        }
        appliedAlias = selected;
        pendingAlias = selected;
        preferences.edit().putString(SELECTED, selected).apply();
        updateButtonLabels(selected);
        applyButton.setEnabled(false);
        selectedPreview.setImageResource(iconForAlias(selected));
        status.setText("Launcher icon applied: " + labelForAlias(selected));
    }

    private void updateButtonLabels(String selected) {
        for (int i = 0; i < CHOICES.length; i++) {
            optionButtons[i].setText(CHOICES[i].alias.equals(selected)
                    ? "Selected  /  " + CHOICES[i].label
                    : CHOICES[i].label);
        }
    }

    private Button button(IconChoice choice) {
        Button button = button(choice.label);
        button.setCompoundDrawablesWithIntrinsicBounds(choice.iconRes, 0, 0, 0);
        button.setCompoundDrawablePadding(dp(12));
        return button;
    }

    private Button button(String label) {
        Button button = new Button(this);
        button.setAllCaps(false);
        button.setGravity(Gravity.CENTER_VERTICAL | Gravity.LEFT);
        button.setPadding(dp(16), 0, dp(16), 0);
        button.setText(label);
        button.setTextColor(INK);
        GradientDrawable background = new GradientDrawable();
        background.setColor(Color.WHITE);
        background.setStroke(dp(1), GREEN);
        background.setCornerRadius(dp(12));
        button.setBackground(background);
        return button;
    }

    private int iconForAlias(String alias) {
        for (IconChoice choice : CHOICES) {
            if (choice.alias.equals(alias)) return choice.iconRes;
        }
        return CHOICES[0].iconRes;
    }

    private String labelForAlias(String alias) {
        for (IconChoice choice : CHOICES) {
            if (choice.alias.equals(alias)) return choice.label;
        }
        return CHOICES[0].label;
    }

    private void chooseImage() {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.setType("image/*");
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        startActivityForResult(intent, REQUEST_PICK_IMAGE);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQUEST_PICK_IMAGE || resultCode != RESULT_OK || data == null || data.getData() == null) return;
        Uri imageUri = data.getData();
        try (InputStream stream = getContentResolver().openInputStream(imageUri)) {
            BitmapFactory.Options bounds = new BitmapFactory.Options();
            bounds.inJustDecodeBounds = true;
            BitmapFactory.decodeStream(stream, null, bounds);
            int sample = 1;
            while (bounds.outWidth / sample > 1024 || bounds.outHeight / sample > 1024) sample *= 2;
            BitmapFactory.Options options = new BitmapFactory.Options();
            options.inSampleSize = sample;
            Bitmap source;
            try (InputStream decodedStream = getContentResolver().openInputStream(imageUri)) {
                source = BitmapFactory.decodeStream(decodedStream, null, options);
            }
            if (source == null) throw new IllegalArgumentException("Image could not be decoded");
            customBitmap = squareBitmap(source);
            customPreview.setImageBitmap(customBitmap);
            customPreview.setVisibility(View.VISIBLE);
            shortcutButton.setEnabled(true);
            status.setText("Image ready. Add it as a home-screen shortcut.");
        } catch (Exception error) {
            status.setText("That image could not be opened. Choose another file.");
        }
    }

    private Bitmap squareBitmap(Bitmap source) {
        int size = Math.min(source.getWidth(), source.getHeight());
        Bitmap cropped = Bitmap.createBitmap(source, (source.getWidth() - size) / 2, (source.getHeight() - size) / 2, size, size);
        return Bitmap.createScaledBitmap(cropped, 512, 512, true);
    }

    private void addImageShortcut() {
        if (customBitmap == null) return;
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            status.setText("Custom image shortcuts require Android 8 or newer.");
            return;
        }
        ShortcutManager shortcuts = getSystemService(ShortcutManager.class);
        if (shortcuts == null || !shortcuts.isRequestPinShortcutSupported()) {
            status.setText("This launcher does not support custom pinned shortcuts.");
            return;
        }
        Intent launchIntent = new Intent(this, LauncherActivity.class);
        launchIntent.setAction(Intent.ACTION_MAIN);
        ShortcutInfo shortcut = new ShortcutInfo.Builder(this, "deriva-custom-image")
                .setShortLabel("Deriva")
                .setLongLabel("Deriva custom image")
                .setIcon(Icon.createWithBitmap(customBitmap))
                .setIntent(launchIntent)
                .build();
        shortcuts.requestPinShortcut(shortcut, null);
        status.setText("Android will ask where to place your custom Deriva shortcut.");
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
        final int iconRes;

        IconChoice(String label, String alias, int color, int iconRes) {
            this.label = label;
            this.alias = alias;
            this.color = color;
            this.iconRes = iconRes;
        }
    }
}
