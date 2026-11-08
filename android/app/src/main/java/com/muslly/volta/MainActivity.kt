package com.muslly.volta

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.net.http.SslError
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.webkit.GeolocationPermissions
import android.webkit.SslErrorHandler
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat

private const val APP_HOST = "volta.muslly.com"
private const val APP_ORIGIN = "https://volta.muslly.com"

class MainActivity : ComponentActivity() {
    private lateinit var webView: WebView
    private lateinit var errorPanel: LinearLayout
    private lateinit var errorTitle: TextView
    private lateinit var errorMessage: TextView
    private lateinit var retryButton: Button
    private var mainFrameFailed = false
    private var geoCallback: GeolocationPermissions.Callback? = null
    private var geoOrigin: String? = null

    private val locationPermission = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { result ->
        val granted = result[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
            result[Manifest.permission.ACCESS_COARSE_LOCATION] == true
        geoCallback?.invoke(geoOrigin, granted, false)
        geoCallback = null
        geoOrigin = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val root = FrameLayout(this)
        webView = WebView(this)
        root.addView(
            webView,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        )

        errorPanel = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(dp(28), dp(28), dp(28), dp(28))
            setBackgroundColor(Color.rgb(247, 245, 239))
            visibility = View.VISIBLE
        }

        errorTitle = TextView(this).apply {
            text = "VOLTA"
            textSize = 26f
            setTextColor(Color.rgb(31, 74, 64))
            gravity = Gravity.CENTER
        }
        errorMessage = TextView(this).apply {
            textSize = 16f
            setTextColor(Color.rgb(65, 82, 76))
            gravity = Gravity.CENTER
            setPadding(0, dp(18), 0, dp(22))
        }
        retryButton = Button(this).apply {
            text = "إعادة المحاولة"
            setOnClickListener { openApp() }
        }

        errorPanel.addView(errorTitle)
        errorPanel.addView(
            errorMessage,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        )
        errorPanel.addView(retryButton)
        root.addView(
            errorPanel,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        )
        setContentView(root)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            setGeolocationEnabled(true)
            allowFileAccess = false
            allowContentAccess = false
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            cacheMode = WebSettings.LOAD_DEFAULT
        }

        android.webkit.CookieManager.getInstance().setAcceptCookie(true)

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?
            ): Boolean {
                val uri = request?.url ?: return true
                val isTrustedAppUrl =
                    uri.scheme == "https" &&
                    uri.host == APP_HOST &&
                    (uri.port == -1 || uri.port == 443)

                if (isTrustedAppUrl) return false

                // Only hand ordinary web links to the browser. Never launch
                // file:, content:, javascript:, intent:, or unknown schemes.
                if (uri.scheme == "https" || uri.scheme == "mailto" || uri.scheme == "tel") {
                    runCatching { startActivity(Intent(Intent.ACTION_VIEW, uri)) }
                }
                return true
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                mainFrameFailed = false
                showStatus("جارٍ الاتصال بخادم VOLTA…", showRetry = false)
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                if (!mainFrameFailed) {
                    errorPanel.visibility = View.GONE
                    webView.visibility = View.VISIBLE
                }
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: android.webkit.WebResourceError?
            ) {
                if (request?.isForMainFrame == true) {
                    mainFrameFailed = true
                    showFailure(
                        "تعذر الاتصال بخادم VOLTA",
                        "تحقق من اتصال الإنترنت ثم أعد المحاولة.\n\n" +
                            (error?.description?.toString() ?: "لم يستجب الخادم.")
                    )
                }
            }

            override fun onReceivedHttpError(
                view: WebView?,
                request: WebResourceRequest?,
                response: android.webkit.WebResourceResponse?
            ) {
                if (request?.isForMainFrame == true) {
                    val code = response?.statusCode ?: 0
                    mainFrameFailed = true
                    val explanation = if (code == 404 || code == 503) {
                        "نسخة VOLTA ليست منشورة حالياً على رابط الإنتاج. لا توجد مشكلة في تثبيت APK؛ يجب إكمال نشر الموقع أولاً."
                    } else {
                        "أعاد خادم VOLTA رمز HTTP $code. أعد المحاولة لاحقاً."
                    }
                    showFailure("الخادم لم يفتح التطبيق", explanation)
                }
            }

            override fun onReceivedSslError(
                view: WebView?,
                handler: SslErrorHandler?,
                error: SslError?
            ) {
                handler?.cancel()
                mainFrameFailed = true
                showFailure(
                    "تعذر الاتصال الآمن",
                    "لم يتم قبول شهادة HTTPS الخاصة بالخادم. لم يتم تجاوز فحص الأمان."
                )
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onGeolocationPermissionsShowPrompt(
                origin: String?,
                callback: GeolocationPermissions.Callback?
            ) {
                if (origin != APP_ORIGIN) {
                    callback?.invoke(origin, false, false)
                    return
                }

                val fine = ContextCompat.checkSelfPermission(
                    this@MainActivity,
                    Manifest.permission.ACCESS_FINE_LOCATION
                ) == PackageManager.PERMISSION_GRANTED
                val coarse = ContextCompat.checkSelfPermission(
                    this@MainActivity,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                ) == PackageManager.PERMISSION_GRANTED

                if (fine || coarse) {
                    callback?.invoke(origin, true, false)
                } else {
                    geoOrigin = origin
                    geoCallback = callback
                    locationPermission.launch(
                        arrayOf(
                            Manifest.permission.ACCESS_FINE_LOCATION,
                            Manifest.permission.ACCESS_COARSE_LOCATION
                        )
                    )
                }
            }
        }

        if (savedInstanceState == null || webView.restoreState(savedInstanceState) == null) {
            openApp()
        } else {
            showStatus("جارٍ استعادة VOLTA…", showRetry = false)
        }
    }

    private fun openApp() {
        mainFrameFailed = false
        webView.visibility = View.VISIBLE
        showStatus("جارٍ الاتصال بخادم VOLTA…", showRetry = false)
        webView.loadUrl(APP_ORIGIN)
    }

    private fun showStatus(message: String, showRetry: Boolean) {
        errorMessage.text = message
        retryButton.visibility = if (showRetry) View.VISIBLE else View.GONE
        errorPanel.visibility = View.VISIBLE
        webView.visibility = View.VISIBLE
    }

    private fun showFailure(title: String, message: String) {
        errorTitle.text = title
        errorMessage.text = message
        retryButton.visibility = View.VISIBLE
        errorPanel.visibility = View.VISIBLE
        webView.visibility = View.GONE
    }

    private fun dp(value: Int): Int =
        (value * resources.displayMetrics.density).toInt()

    override fun onSaveInstanceState(outState: Bundle) {
        webView.saveState(outState)
        super.onSaveInstanceState(outState)
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (this::webView.isInitialized && webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onDestroy() {
        geoCallback = null
        if (this::webView.isInitialized) {
            webView.stopLoading()
            webView.destroy()
        }
        super.onDestroy()
    }
}
