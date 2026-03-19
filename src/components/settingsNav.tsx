import Slider from "./utils/slider";
import type { EngineSettings } from "../assets/types";
import { useSettings } from "../contexts/SettingsContext";

export default function SettingsNav() {
    const { settings, updateSettings } = useSettings();

    const rotationSpeed = settings?.accessibility[0] ?? 45;
    const scaleSpeed = settings?.accessibility[1] ?? 5;
    const showUsersId = settings?.accessibility[2] ?? false;
    const showUsersMouse = settings?.accessibility[3] ?? false;
    const addColors = settings?.accessibility[4] ?? false;
    const masterAudio = settings?.audio[0] ?? 100;
    const sfxAudio = settings?.audio[1] ?? 100;
    const musicAudio = settings?.audio[2] ?? 25;
    const notifyBalance = settings?.notifications ?? false;
    const gameEngine = settings?.gameEngine ?? "2d";

    function setAccessibility(index: number, value: number | boolean) {
        const acc = [...(settings?.accessibility ?? [45, 5, false, false, false])] as [number, number, boolean, boolean, boolean];
        (acc as any)[index] = value;
        updateSettings({ accessibility: acc });
    }

    function setAudio(index: number, value: number) {
        const audio = [...(settings?.audio ?? [100, 100, 25])] as [number, number, number];
        audio[index] = value;
        updateSettings({ audio });
    }

    return (
        <>
            <h3 style={{ textAlign: "center" }}>Settings</h3>
            <div className="scroll">
                <div className="settingsItem">
                    <p>Game Engine </p>
                    <div>
                        <select
                            value={gameEngine}
                            onChange={(e) =>
                                updateSettings({ gameEngine: e.target.value as EngineSettings })
                            }
                        >
                            <option value="2d">2D</option>
                            <option value="3d">3D</option>
                        </select>
                    </div>
                </div>
                <p
                    style={{
                        marginBlock: 0,
                        marginInline: 10,
                        fontSize: 12,
                        opacity: 0.5,
                    }}
                >
                    3d isnt developed yet{" "}
                </p>
                <br />
                <hr />
                <h2>Accessibility</h2>
                <div>
                    <div className="settingsItem">
                        <p>Rotation Speed </p>
                        <Slider
                            step={90 / 8}
                            min={0}
                            max={180}
                            defaultValue={rotationSpeed}
                            onChange={(e) => setAccessibility(0, parseFloat(e.currentTarget.value))}
                            fixedNum={2}
                            suffix=" deg"
                        />
                    </div>
                    <div className="settingsItem">
                        <p>Scale Speed </p>
                        <Slider
                            step={1}
                            min={1}
                            max={10}
                            defaultValue={scaleSpeed}
                            onChange={(e) => setAccessibility(1, parseFloat(e.currentTarget.value))}
                            fixedNum={0}
                        />
                    </div>
                    <div className="settingsItem">
                        <p>Show Users Id </p>
                        <div>
                            <input
                                checked={showUsersId}
                                type="checkbox"
                                onChange={(e) => setAccessibility(2, e.currentTarget.checked)}
                            />
                        </div>
                    </div>
                    <div className="settingsItem">
                        <p>Show Users Mouse </p>
                        <div>
                            <input
                                checked={showUsersMouse}
                                type="checkbox"
                                onChange={(e) => setAccessibility(3, e.currentTarget.checked)}
                            />
                        </div>
                    </div>
                    <div className="settingsItem">
                        <p>Add Colors to Users </p>
                        <div>
                            <input
                                checked={addColors}
                                type="checkbox"
                                onChange={(e) => setAccessibility(4, e.currentTarget.checked)}
                            />
                        </div>
                    </div>
                    <br />
                    <hr />
                </div>
                <h2>Audio</h2>
                <div>
                    <div className="settingsItem">
                        <p>Master Audio </p>
                        <Slider
                            step={1}
                            min={0}
                            max={100}
                            defaultValue={masterAudio}
                            fixedNum={0}
                            suffix="%"
                            onChange={(e) => setAudio(0, parseFloat(e.currentTarget.value))}
                        />
                    </div>
                    <div className="settingsItem">
                        <p>SFX Audio </p>
                        <Slider
                            step={1}
                            min={0}
                            max={100}
                            defaultValue={sfxAudio}
                            fixedNum={0}
                            suffix="%"
                            onChange={(e) => setAudio(1, parseFloat(e.currentTarget.value))}
                        />
                    </div>
                    <div className="settingsItem">
                        <p>Music Audio </p>
                        <Slider
                            step={1}
                            min={0}
                            max={100}
                            defaultValue={musicAudio}
                            fixedNum={0}
                            suffix="%"
                            onChange={(e) => setAudio(2, parseFloat(e.currentTarget.value))}
                        />
                    </div>
                    <br />
                    <hr />
                </div>
                <h2>Notifications</h2>
                <div>
                    <div className="settingsItem">
                        <p>Notify Balance Movements </p>
                        <div>
                            <input
                                checked={notifyBalance}
                                type="checkbox"
                                onChange={(e) => updateSettings({ notifications: e.currentTarget.checked })}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
