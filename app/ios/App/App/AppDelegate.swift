import UIKit
import Capacitor
import AppTrackingTransparency
import StoreKit
import GameKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
        AppDelegate.requestTrackingIfNeeded()
    }

    // App Tracking Transparency: uygulama etkin olduğunda, reklam SDK'sı başlamadan önce ana iş parçacığında istenir.
    // iOS etkin olmayan uygulamadan gelen isteği yok saydığı için kısa bir gecikmeyle çağrılır.
    static func requestTrackingIfNeeded() {
        if #available(iOS 14, *) {
            guard ATTrackingManager.trackingAuthorizationStatus == .notDetermined else { return }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
                guard UIApplication.shared.applicationState == .active,
                      ATTrackingManager.trackingAuthorizationStatus == .notDetermined else { return }
                ATTrackingManager.requestTrackingAuthorization { _ in }
            }
        }
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let config = UISceneConfiguration(name: "Default Configuration",
                                          sessionRole: connectingSceneSession.role)
        config.delegateClass = SceneDelegate.self
        return config
    }
}

// Uygulamaya özel Capacitor köprüsü: yerel eklentileri kaydeder.
class StarfootViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(StarfootReviewPlugin())
        bridge?.registerPluginInstance(StarfootCloudPlugin())
        bridge?.registerPluginInstance(StarfootGameCenterPlugin())
    }
}

// Apple'ın "Bu oyunu değerlendir" penceresi (JS: Capacitor.registerPlugin('StarfootReview').request()).
// Gösterilip gösterilmeyeceğine iOS karar verir; yılda en fazla 3 kez çıkar.
@objc(StarfootReviewPlugin)
public class StarfootReviewPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StarfootReviewPlugin"
    public let jsName = "StarfootReview"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "request", returnType: CAPPluginReturnPromise)
    ]

    @objc func request(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let scene = UIApplication.shared.connectedScenes
                .first { $0.activationState == .foregroundActive } as? UIWindowScene
            if let scene = scene {
                if #available(iOS 16.0, *) {
                    AppStore.requestReview(in: scene)
                } else {
                    SKStoreReviewController.requestReview(in: scene)
                }
            }
            call.resolve()
        }
    }
}

// iCloud anahtar-değer deposu: kariyer kayıtlarının yedeği (JS: StarfootCloud).
// Değerler base64 olarak gelir, iCloud'da ham veri (Data) olarak saklanır. Toplam sınır 1 MB.
@objc(StarfootCloudPlugin)
public class StarfootCloudPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StarfootCloudPlugin"
    public let jsName = "StarfootCloud"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "get", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "set", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "remove", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "list", returnType: CAPPluginReturnPromise)
    ]
    private let store = NSUbiquitousKeyValueStore.default

    override public func load() {
        NotificationCenter.default.addObserver(self, selector: #selector(changed(_:)),
            name: NSUbiquitousKeyValueStore.didChangeExternallyNotification, object: store)
        store.synchronize()
    }

    @objc func changed(_ n: Notification) {
        let keys = (n.userInfo?[NSUbiquitousKeyValueStoreChangedKeysKey] as? [String]) ?? []
        let reason = (n.userInfo?[NSUbiquitousKeyValueStoreChangeReasonKey] as? Int) ?? -1
        notifyListeners("change", data: ["keys": keys, "quota": reason == NSUbiquitousKeyValueStoreQuotaViolationChange])
    }

    @objc func status(_ call: CAPPluginCall) {
        call.resolve(["available": FileManager.default.ubiquityIdentityToken != nil])
    }

    @objc func get(_ call: CAPPluginCall) {
        guard let key = call.getString("key") else { return call.reject("key") }
        if let d = store.data(forKey: key) { call.resolve(["data": d.base64EncodedString()]) }
        else if let s = store.string(forKey: key) { call.resolve(["text": s]) }
        else { call.resolve([:]) }
    }

    @objc func set(_ call: CAPPluginCall) {
        guard let key = call.getString("key") else { return call.reject("key") }
        if let b = call.getString("data"), let d = Data(base64Encoded: b) { store.set(d, forKey: key) }
        else if let t = call.getString("text") { store.set(t, forKey: key) }
        else { return call.reject("value") }
        store.synchronize()
        call.resolve()
    }

    @objc func remove(_ call: CAPPluginCall) {
        guard let key = call.getString("key") else { return call.reject("key") }
        store.removeObject(forKey: key)
        store.synchronize()
        call.resolve()
    }

    @objc func list(_ call: CAPPluginCall) {
        call.resolve(["keys": Array(store.dictionaryRepresentation.keys)])
    }
}

// Game Center: giriş, liderlik tabloları ve başarımlar (JS: StarfootGameCenter).
@objc(StarfootGameCenterPlugin)
public class StarfootGameCenterPlugin: CAPPlugin, CAPBridgedPlugin, GKGameCenterControllerDelegate {
    public let identifier = "StarfootGameCenterPlugin"
    public let jsName = "StarfootGameCenter"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "auth", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "submit", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "achieve", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "show", returnType: CAPPluginReturnPromise)
    ]
    private var waiting: [CAPPluginCall] = []
    private var started = false

    @objc func auth(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let me = GKLocalPlayer.local
            if me.isAuthenticated { return call.resolve(["ok": true]) }
            self.waiting.append(call)
            if self.started { return }
            self.started = true
            me.authenticateHandler = { [weak self] vc, err in
                guard let self = self else { return }
                if let vc = vc {
                    self.bridge?.viewController?.present(vc, animated: true)
                    return
                }
                let ok = GKLocalPlayer.local.isAuthenticated
                self.waiting.forEach { $0.resolve(["ok": ok, "error": err?.localizedDescription ?? ""]) }
                self.waiting.removeAll()
                self.notifyListeners("auth", data: ["ok": ok])
            }
        }
    }

    @objc func submit(_ call: CAPPluginCall) {
        guard GKLocalPlayer.local.isAuthenticated else { return call.resolve(["ok": false]) }
        let scores = call.getArray("scores", JSObject.self) ?? []
        let group = DispatchGroup()
        for s in scores {
            guard let id = s["id"] as? String, let v = (s["value"] as? NSNumber)?.intValue else { continue }
            group.enter()
            GKLeaderboard.submitScore(v, context: 0, player: GKLocalPlayer.local, leaderboardIDs: [id]) { _ in group.leave() }
        }
        group.notify(queue: .main) { call.resolve(["ok": true]) }
    }

    @objc func achieve(_ call: CAPPluginCall) {
        guard GKLocalPlayer.local.isAuthenticated else { return call.resolve(["ok": false]) }
        let ids = call.getArray("ids", String.self) ?? []
        let list: [GKAchievement] = ids.map {
            let a = GKAchievement(identifier: $0)
            a.percentComplete = 100
            a.showsCompletionBanner = true
            return a
        }
        if list.isEmpty { return call.resolve(["ok": true]) }
        GKAchievement.report(list) { err in call.resolve(["ok": err == nil]) }
    }

    @objc func show(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard GKLocalPlayer.local.isAuthenticated else { return call.resolve(["ok": false]) }
            let state: GKGameCenterViewControllerState = call.getString("view") == "achievements" ? .achievements : .leaderboards
            let vc = GKGameCenterViewController(state: state)
            vc.gameCenterDelegate = self
            self.bridge?.viewController?.present(vc, animated: true)
            call.resolve(["ok": true])
        }
    }

    public func gameCenterViewControllerDidFinish(_ vc: GKGameCenterViewController) {
        vc.dismiss(animated: true)
    }
}
